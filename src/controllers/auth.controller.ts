import { hashPassword, comparePassword } from "../utils/bcryptpassword";

const register = async (req: Request): Promise<Response> => {
    try {
        return new Response('Register successful', { status: 200 });
    } catch (error) {
        return new Response('Register failed', { status: 500 });
    }
}

const login = async (req: Request): Promise<Response> => {
    try {
 
        return new Response('Login successful', { status: 200 });
    } catch (error) {
        return new Response('Login failed', { status: 500 });
    }
}


const logout = async (req: Request): Promise<Response> => {
    try {
        return new Response('Logout successful', { status: 200 });
    } catch (error) {
        return new Response('Logout failed', { status: 500 });
    }
}

export { login, register, logout };