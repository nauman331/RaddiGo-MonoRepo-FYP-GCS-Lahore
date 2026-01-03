import mysql from "../config/sqldb";
import type { IUser } from "../types";
import { sendPasswordResetEmail } from "../utils/mailsender";
import { signToken } from "../utils/jwttoken";
import redis from "../config/redis";

const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const register = async (req: Request): Promise<Response> => {
    try {
        const { username, password, email, phone } = await req.json() as IUser;
        if (!username || !password || !email || !phone) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [existingEmail] = await mysql<IUser[]>`
            SELECT * FROM users WHERE email = ${email}
        `;
        if (existingEmail) {
            return Response.json({ message: 'Email already in use' }, { status: 400 });
        }

        const [existingPhone] = await mysql<IUser[]>`
            SELECT * FROM users WHERE phone = ${phone}
        `;
        if (existingPhone) {
            return Response.json({ message: 'Phone number already in use' }, { status: 400 });
        }

        const hashedPassword = await Bun.password.hash(password, "bcrypt");
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes

        await sendPasswordResetEmail(email, otp);

        await mysql`
            INSERT INTO users (username, email, password, phone, role, isVerified, otp, otpExpiry)
            VALUES (${username}, ${email}, ${hashedPassword}, ${phone}, 'customer', false, ${otp}, ${otpExpiry})
        `;

        return Response.json({ message: 'Register successful. Please check your email for OTP' }, { status: 200 });
    } catch (error) {
        console.error('Register error:', error);
        return Response.json({ message: 'Register failed' }, { status: 500 });
    }
}

const verifyEmail = async (req: Request): Promise<Response> => {
    try {
        const { email, otp } = await req.json() as IUser & { otp: string };
        if (!email || !otp) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [user] = await mysql<IUser[]>`
            SELECT * FROM users WHERE email = ${email}
        `;

        if (!user) {
            return Response.json({ message: 'Invalid OTP or email' }, { status: 400 });
        }
        if (!user.otp) {
            return Response.json({ message: 'No verification OTP found' }, { status: 400 });
        }
        if (!user.otpExpiry || new Date(user.otpExpiry) < new Date()) {
            return Response.json({ message: 'OTP has expired! Request a new one' }, { status: 400 });
        }
        if (user.otp !== otp) {
            return Response.json({ message: 'Invalid OTP' }, { status: 400 });
        }

        await mysql`
            UPDATE users SET isVerified = true, otp = NULL, otpExpiry = NULL 
            WHERE id = ${user.id}
        `;

        return Response.json({ message: 'Email verified successfully' }, { status: 200 });
    } catch (error) {
        return Response.json({ message: 'Email verification failed' }, { status: 500 });
    }
}

const login = async (req: Request): Promise<Response> => {
    try {
        const { email, password } = await req.json() as IUser;
        if (!email || !password) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [user] = await mysql<IUser[]>`
            SELECT * FROM users WHERE email = ${email}
        `;

        if (!user) {
            return Response.json({ message: 'Email Not registered' }, { status: 401 });
        }

        const isPasswordValid = await Bun.password.verify(password, user.password, "bcrypt");
        if (!isPasswordValid) {
            return Response.json({ message: 'Invalid password' }, { status: 401 });
        }
        if (!user.isVerified) {
            return Response.json({ message: 'Email not verified' }, { status: 403 });
        }

        const token = signToken(user.id.toString());
        return Response.json({ token, userId: user.id, role: user.role, isOk: true }, { status: 200 });
    } catch (error) {
        console.error('Login error:', error);
        return Response.json({ message: 'Login failed' }, { status: 500 });
    }
}

const resendVerificationEmail = async (req: Request): Promise<Response> => {
    try {
        const { email } = await req.json() as IUser;
        if (!email) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [user] = await mysql<IUser[]>`
            SELECT * FROM users WHERE email = ${email}
        `;

        if (!user) {
            return Response.json({ message: 'Email Not registered' }, { status: 401 });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes

        await mysql`
            UPDATE users SET otp = ${otp}, otpExpiry = ${otpExpiry} 
            WHERE id = ${user.id}
        `;

        await sendPasswordResetEmail(email, otp);
        return Response.json({ message: 'Verification OTP resent successfully' }, { status: 200 });
    } catch (error) {
        return Response.json({ message: 'Resending verification OTP failed' }, { status: 500 });
    }
}

const getMe = async (req: Request): Promise<Response> => {
    try {
        const user = (req as any).user;
        if (!user) {
            return Response.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const cachedUser = await redis.get(`user:${user.userId}`);
        if (cachedUser) {
            let userObj: any = cachedUser;
            if (typeof cachedUser === 'string') {
                try {
                    userObj = JSON.parse(cachedUser);
                } catch (e) {
                    userObj = cachedUser;
                }
            }
            return Response.json({ user: userObj }, { status: 200 });
        }

        const [userData] = await mysql<IUser[]>`
            SELECT * FROM users WHERE id = ${user.userId}
        `;

        if (!userData) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        await redis.set(`user:${user.userId}`, JSON.stringify(userData));
        return Response.json({ user: userData }, { status: 200 });
    } catch (error) {
        return Response.json({ message: 'Failed to fetch user data' }, { status: 500 });
    }
}

const deleteMe = async (req: Request): Promise<Response> => {
    try {
        const user = (req as any).user;
        if (!user) {
            return Response.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await mysql`
            DELETE FROM users WHERE id = ${user.userId}
        `;

        await redis.del(`user:${user.userId}`);
        return Response.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (error) {
        return Response.json({ message: 'Failed to delete user' }, { status: 500 });
    }
}

const resetPassword = async (req: Request): Promise<Response> => {
    try {
        const { email, password, otp } = await req.json() as IUser & { otp: string };
        if (!email || !password || !otp) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [user] = await mysql<IUser[]>`
        SELECT * FROM users WHERE email = ${email}
        `;
        if (!user) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }
        if (user.otp !== otp) {
            return Response.json({ message: 'Invalid OTP' }, { status: 400 });
        }
        if (!user.otpExpiry || new Date(user.otpExpiry) < new Date()) {
            return Response.json({ message: 'OTP has expired! Request a new one' }, { status: 400 });
        }
        const hashedPassword = await Bun.password.hash(password, "bcrypt");
        await mysql`
        UPDATE users SET password = ${hashedPassword}, otp = NULL, otpExpiry = NULL 
        WHERE id = ${user.id}`;

        return Response.json({ message: 'Password reset successfully' }, { status: 200 });

    } catch (error) {
        return Response.json({ message: 'Failed to reset password' }, { status: 500 });
    }
}

const doGoogleLogin = async (req: Request): Promise<Response> => {
    try {
        return Response.json({ message: 'Google login not implemented yet' }, { status: 501 });
    } catch (error) {
        return Response.json({ message: 'Google login failed' }, { status: 500 });
    }
}

export { register, login, verifyEmail, resendVerificationEmail, getMe, deleteMe, resetPassword, doGoogleLogin };