import { User, type IUser } from "../models/user.model";
import { sendPasswordResetEmail } from "../utils/mailsender";
import { randomUUIDv7 } from "bun";
import { signToken } from "../utils/jwttoken";
import redis from "../config/redis";

const register = async (req: Request): Promise<Response> => {
    try {
        const { username, password, email, phone } = await req.json() as IUser;
        if(!username || !password || !email || !phone) {
            return new Response('Missing required fields', { status: 400 });
        }
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return new Response('Email already in use', { status: 400 });
        }

        const existingPhone = await User.findByPhone(phone);
        if (existingPhone) {
            return new Response('Phone number already in use', { status: 400 });
        }
        const hashedPassword = await Bun.password.hash(password, "bcrypt");
        const token = randomUUIDv7();
        await sendPasswordResetEmail(email, `${process.env.FRONTEND_URL}/verify-email?token=${token}`);
        await User.create({
            username,
            email,
            password: hashedPassword,
            phone,
            role: "user",
            isVerified: false,
            token,
            tokenExpiry: new Date(Date.now() + 24 * 3600000) //24 Hours
        });
        return new Response('Register successful Please Verify Your Email', { status: 200 });
    } catch (error) {
        console.error('Register error:', error);
        return new Response('Register failed', { status: 500 });
    }
}
const verifyEmail = async (req: Request): Promise<Response> => {
    try {
        const { email, token } = await req.json() as IUser;
        if(!email || !token) {
            return new Response('Missing required fields', { status: 400 });
        }
        const user = await User.findByEmail(email);
            if (!user) {
            return new Response('Invalid token or email', { status: 400 });
        }
        if (!user.token) {
            return new Response('No verification token found', { status: 400 });
        }
        if (!user.tokenExpiry || new Date(user.tokenExpiry) < new Date()) {
            return new Response('Token has expired! Request a new one', { status: 400 });
        }
        if (user.token !== token) {
            return new Response('Invalid token', { status: 400 });
        }
        await User.updateUser(user.id, { isVerified: true, token: undefined, tokenExpiry: undefined });
        return new Response('Email verified successfully', { status: 200 });
    } catch (error) {
        return new Response('Email verification failed', { status: 500 });
    }
}
const login = async (req: Request): Promise<Response> => {
    try {
        const {email, password} = await req.json() as IUser;
        if(!email || !password) {
            return new Response('Missing required fields', { status: 400 });
        }
        const user = await User.findByEmail(email);
        if (!user) {
            return new Response('Email Not registered', { status: 401 });
        }
        const isPasswordValid = await Bun.password.verify(password, user.password, "bcrypt");
        if (!isPasswordValid) {
            return new Response('Invalid password', { status: 401 });
        }
        if (!user.isVerified) {
            return new Response('Email not verified', { status: 403 });
        }
        const token = signToken(user.id.toString());
        return Response.json({ token, userId: user.id, role: user.role, isOk: true }, { status: 200 });
    } catch (error) {
        console.error('Login error:', error);
        return new Response('Login failed', { status: 500 });
    }
}
const resendVerificationEmail = async (req: Request): Promise<Response> => {
    try {
        const { email } = await req.json() as IUser;
        if(!email) {
            return new Response('Missing required fields', { status: 400 });
        }
        const user = await User.findByEmail(email);
        if (!user) {
            return new Response('Email Not registered', { status: 401 });
        }
        const token = randomUUIDv7();
        await User.updateUser(user.id, { token, tokenExpiry: new Date(Date.now() + 24 * 3600000) }); //24 Hours
        await sendPasswordResetEmail(email, `${process.env.FRONTEND_URL}/verify-email?token=${token}`);
        return new Response('Verification email resent successfully', { status: 200 });
    } catch (error) {
        return new Response('Resending verification email failed', { status: 500 });
    }
}
const getMe = async (req: Request): Promise<Response> => {
    try {
        const user = (req as any).user;
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }
        const cachedUser = await redis.get(`user:${user.userId}`);
        if (cachedUser) {
            return Response.json({ user: JSON.parse(cachedUser) }, { status: 200 });
        }
        const userData = await User.findById(user.userId);
        if (!userData) {
            return new Response('User not found', { status: 404 });
        }
        await redis.setex(`user:${user.userId}`, 3600, JSON.stringify(userData)); // Cache for 1 hour
        return Response.json({ user: userData }, { status: 200 });
    } catch (error) {
        return new Response('Failed to fetch user data', { status: 500 });
    }
}
const deleteMe = async (req: Request): Promise<Response> => {
    try {
        const user = (req as any).user;
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }
        await User.deleteUser(user.userId);
        await redis.del(`user:${user.userId}`);
        return new Response('User deleted successfully', { status: 200 });
    } catch (error) {
        return new Response('Failed to delete user', { status: 500 });
    }
}
export { register,login, verifyEmail, resendVerificationEmail, getMe, deleteMe };