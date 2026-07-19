import api from './axios';
import type { LoginResponse, IUser } from '../types';

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/api/v1/admin-login', { email, password });
  return data;
};

export const getMe = async (): Promise<IUser> => {
  const { data } = await api.get('/auth/api/v1/me');
  return data.user;
};
