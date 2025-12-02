import { User, type IUser } from "../models/user.model";
import { hashPassword, comparePassword } from "../utils/bcryptpassword";
import { sendPasswordResetEmail } from "../utils/mailsender";
import { randomUUIDv7 } from "bun";
import { signToken } from "../utils/jwttoken";

const register = async (req: Request): Promise<Response> => {
    try {
        const { username, password, email, phone } = await req.json() as IUser;
        if(!username || !password || !email || !phone) {
            return new Response('Missing required fields', { status: 400 });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return new Response('Email already in use', { status: 400 });
        }

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return new Response('Phone number already in use', { status: 400 });
        }
        const hashedPassword = await hashPassword(password);
        const token = randomUUIDv7();
        await sendPasswordResetEmail(email, `${process.env.FRONTEND_URL}/verify-email?token=${token}`);
        const newUser = new User({
            username,
            email,
            phone,
            password: hashedPassword,
            isVerified: false,
            token,
            tokenExpiry: new Date(Date.now() + 3600000) 
        });
        await newUser.save();
        return new Response('Register successful Please Verify Your Email', { status: 200 });
    } catch (error) {
        return new Response('Register failed', { status: 500 });
    }
}
const verifyEmail = async (req: Request): Promise<Response> => {
    try {
        const { email, token } = await req.json() as IUser;
        if(!email || !token) {
            return new Response('Missing required fields', { status: 400 });
        }
        const user = await User.findOne({ email, token });
        if (!user) {
            return new Response('Invalid token or email', { status: 400 });
        }
        if (user.tokenExpiry && (user.tokenExpiry < new Date() || user.token !== token)) {
            return new Response('Invalid or Expired Token! Request a new one', { status: 400 });
        }
        user.isVerified = true;
        user.token = undefined;
        user.tokenExpiry = undefined;
        await user.save();
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
        const user = await User.findOne({ email });
        if (!user) {
            return new Response('Email Not registered', { status: 401 });
        }
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return new Response('Invalid password', { status: 401 });
        }
        if (!user.isVerified) {
            return new Response('Email not verified', { status: 403 });
        }
        const token = signToken(user._id.toString());
        return Response.json({ token, userId: user._id, role: user.role, isOk: true }, { status: 200 });
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
        const user = await User.findOne({ email });
        if (!user) {
            return new Response('Email Not registered', { status: 401 });
        }
        const token = randomUUIDv7();
        user.token = token;
        user.tokenExpiry = new Date(Date.now() + 3600000); 
        await user.save();
        await sendPasswordResetEmail(email, `${process.env.FRONTEND_URL}/verify-email?token=${token}`);
        return new Response('Verification email resent successfully', { status: 200 });
    } catch (error) {
        return new Response('Resending verification email failed', { status: 500 });
    }
}
const getMe = async (req: Request): Promise<Response> => {
    try {
        const user = (req as any).user;
        console.log('GetMe User:', user);
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }
        const userData = await User.findById(user.userId).select('-password -token -tokenExpiry -__v -createdAt -updatedAt');
        if (!userData) {
            return new Response('User not found', { status: 404 });
        }
        return Response.json({ user: userData }, { status: 200 });
    } catch (error) {
        return new Response('Failed to fetch user data', { status: 500 });
    }
}
export { register,login, verifyEmail, resendVerificationEmail, getMe };