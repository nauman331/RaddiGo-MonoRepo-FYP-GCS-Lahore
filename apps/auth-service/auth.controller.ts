import pool, { redis } from '../../packages/db';
import type { IUser } from "../../packages/types/index";
import type { RowDataPacket } from "mysql2";
import { sendPasswordResetEmail } from "../utils/mailsender";
import { signToken } from "../utils/jwttoken";

const safeParseJSON = async <T>(req: Request): Promise<T | null> => {
    try {
        return await req.json() as T;
    } catch (error) {
        return null;
    }
}

const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const register = async (req: Request): Promise<Response> => {
    try {
        const body = await safeParseJSON<IUser>(req);
        if (!body) {
            return Response.json({ message: 'Invalid or missing JSON payload' }, { status: 400 });
        }

        const { username, password, email, phone, role } = body;
        if (!username || !password || !email || !phone) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }
if (!["customer", "collector"].includes(role)) {
    return Response.json({ message: 'Role is not Correct' }, { status: 401 });
}

        const [existingEmailRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        const existingEmail = (existingEmailRows as unknown as IUser[])[0];
        if (existingEmail) {
            return Response.json({ message: 'Email already in use' }, { status: 400 });
        }

        const [existingPhoneRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM users WHERE phone = ?",
            [phone]
        );
        const existingPhone = (existingPhoneRows as unknown as IUser[])[0];
        if (existingPhone) {
            return Response.json({ message: 'Phone number already in use' }, { status: 400 });
        }

        const hashedPassword = await Bun.password.hash(password, "bcrypt");
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60000); 

        await sendPasswordResetEmail(email, otp);

await pool.execute(
    "INSERT INTO users (username, email, password, phone, role, isVerified, otp, otpExpiry) VALUES (?, ?, ?, ?, ?, false, ?, ?)",
    [username, email, hashedPassword, phone, role, otp, otpExpiry]
);
const [newUser] = await pool.query<RowDataPacket[]>(
  "SELECT id FROM users WHERE email = ?",
  [email]
);
const userId = (newUser[0] as any).id;

await pool.execute("INSERT INTO wallets (user_id) VALUES (?)", [userId]);

        return Response.json({ message: 'Register successful. Please check your email for OTP' }, { status: 200 });
    } catch (error) {
        console.error('Register error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ message: 'Register failed', error: errorMessage }, { status: 500 });
    }
}

const verifyEmail = async (req: Request): Promise<Response> => {
    try {
        const body = await safeParseJSON<IUser & { otp: string }>(req);
        if (!body) {
            return Response.json({ message: 'Invalid or missing JSON payload' }, { status: 400 });
        }

        const { email, otp } = body;
        if (!email || !otp) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [userRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        const user = (userRows as unknown as IUser[])[0];

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

        await pool.execute(
            "UPDATE users SET isVerified = true, otp = NULL, otpExpiry = NULL WHERE id = ?",
            [user.id]
        );

        return Response.json({ message: 'Email verified successfully' }, { status: 200 });
    } catch (error) {
        console.error('Verify Email error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ message: 'Email verification failed', error: errorMessage }, { status: 500 });
    }
}

const login = async (req: Request): Promise<Response> => {
    try {
        const body = await safeParseJSON<IUser>(req);
        if (!body) {
            return Response.json({ message: 'Invalid or missing JSON payload' }, { status: 400 });
        }

        const { email, password } = body;
        if (!email || !password) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [userRows2] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        const user2 = (userRows2 as unknown as IUser[])[0];

        if (!user2) {
            return Response.json({ message: 'Email Not registered' }, { status: 401 });
        }

        const isPasswordValid = user2 ? await Bun.password.verify(password, user2.password, "bcrypt") : false;
        if (!isPasswordValid) {
            return Response.json({ message: 'Invalid password' }, { status: 401 });
        }
        if (!user2.isVerified) {
            return Response.json({ message: 'Email not verified' }, { status: 403 });
        }

        const token = signToken(user2.id.toString());
        return Response.json({ token, userId: user2.id, role: user2.role, isOk: true }, { status: 200 });
    } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ message: 'Login failed', error: errorMessage }, { status: 500 });
    }
}

const resendVerificationEmail = async (req: Request): Promise<Response> => {
    try {
        const body = await safeParseJSON<IUser>(req);
        if (!body) {
            return Response.json({ message: 'Invalid or missing JSON payload' }, { status: 400 });
        }

        const { email } = body;
        if (!email) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [userRows3] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        const user3 = (userRows3 as unknown as IUser[])[0];

        if (!user3) {
            return Response.json({ message: 'Email Not registered' }, { status: 401 });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 15 * 60000); // 15 minutes

        await pool.execute(
            "UPDATE users SET otp = ?, otpExpiry = ? WHERE id = ?",
            [otp, otpExpiry, user3.id]
        );

        await sendPasswordResetEmail(email, otp);
        return Response.json({ message: 'Verification OTP resent successfully' }, { status: 200 });
    } catch (error) {
        console.error('Resend OTP error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ message: 'Resending verification OTP failed', error: errorMessage }, { status: 500 });
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

        const [userDataRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM users WHERE id = ?",
            [user.userId]
        );
        const userData = (userDataRows as unknown as IUser[])[0];

        if (!userData) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }

        await redis.set(`user:${user.userId}`, JSON.stringify(userData));
        return Response.json({ user: userData }, { status: 200 });
    } catch (error) {
        console.error('getMe error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ message: 'Failed to fetch user data', error: errorMessage }, { status: 500 });
    }
}

const deleteMe = async (req: Request): Promise<Response> => {
    try {
        const user = (req as any).user;
        if (!user) {
            return Response.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await pool.execute(
            "DELETE FROM users WHERE id = ?",
            [user.userId]
        );

        await redis.del(`user:${user.userId}`);
        return Response.json({ message: 'User deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('deleteMe error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ message: 'Failed to delete user', error: errorMessage }, { status: 500 });
    }
}

const resetPassword = async (req: Request): Promise<Response> => {
    try {
        const body = await safeParseJSON<IUser & { otp: string }>(req);
        if (!body) {
            return Response.json({ message: 'Invalid or missing JSON payload' }, { status: 400 });
        }

        const { email, password, otp } = body;
        if (!email || !password || !otp) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const [userRows4] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        const user4 = (userRows4 as unknown as IUser[])[0];
        if (!user4) {
            return Response.json({ message: 'User not found' }, { status: 404 });
        }
        if (user4.otp !== otp) {
            return Response.json({ message: 'Invalid OTP' }, { status: 400 });
        }
        if (!user4.otpExpiry || new Date(user4.otpExpiry) < new Date()) {
            return Response.json({ message: 'OTP has expired! Request a new one' }, { status: 400 });
        }
        const hashedPassword = await Bun.password.hash(password, "bcrypt");
        await pool.execute(
            "UPDATE users SET password = ?, otp = NULL, otpExpiry = NULL WHERE id = ?",
            [hashedPassword, user4.id]
        );

        return Response.json({ message: 'Password reset successfully' }, { status: 200 });

    } catch (error) {
        console.error('Reset Password error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ message: 'Failed to reset password', error: errorMessage }, { status: 500 });
    }
}

export const updateProfile = async (req: Request): Promise<Response> => {
    try {
        const user = (req as any).user;
        if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await safeParseJSON<{
            username?: string;
            phone?: string;
            address?: string;
            profilePicture?: string;   // base64 or URL after upload
        }>(req);

        if (!body) return Response.json({ message: 'Invalid JSON' }, { status: 400 });

        // Build dynamic SET clause
        const fields: string[] = [];
        const values: any[] = [];

        if (body.username) {
            fields.push('username = ?');
            values.push(body.username);
        }
        if (body.phone) {
            // Optional: check phone uniqueness
            const [existingPhone] = await pool.query<RowDataPacket[]>(
                "SELECT id FROM users WHERE phone = ? AND id != ?",
                [body.phone, user.userId]
            );
            if (existingPhone.length) {
                return Response.json({ message: 'Phone number already in use' }, { status: 400 });
            }
            fields.push('phone = ?');
            values.push(body.phone);
        }
        if (body.address !== undefined) {
            fields.push('address = ?');
            values.push(body.address);
        }
        if (body.profilePicture) {
            fields.push('profilePicture = ?');
            values.push(body.profilePicture);
        }

        if (fields.length === 0) {
            return Response.json({ message: 'No fields to update' }, { status: 400 });
        }

        values.push(user.userId);
        await pool.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        // Invalidate Redis cache
        await redis.del(`user:${user.userId}`);

        // Fetch updated user
        const [updatedRows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM users WHERE id = ?",
            [user.userId]
        );
        const updatedUser = (updatedRows as any)[0];

        return Response.json({ message: 'Profile updated', user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error('updateProfile error:', error);
        return Response.json({ message: 'Profile update failed' }, { status: 500 });
    }
};

const doGoogleLogin = async (req: Request): Promise<Response> => {
    try {
        return Response.json({ message: 'Google login not implemented yet' }, { status: 501 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return Response.json({ message: 'Google login failed', error: errorMessage }, { status: 500 });
    }
}

export { register, login, verifyEmail, resendVerificationEmail, getMe, deleteMe, resetPassword, doGoogleLogin, updateProfile };
