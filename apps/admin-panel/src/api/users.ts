import api from './axios';
import type { IUser } from '../types';

export const getUsers = async (): Promise<IUser[]> => {
    const { data } = await api.get('/admin/api/v1/users');
    return data.users;
};

export const updateUser = async (id: number, updates: { username?: string; phone?: string; role?: string }): Promise<void> => {
    await api.put(`/admin/api/v1/users/edit?id=${id}`, updates);
};

export const toggleUserStatus = async (id: number, isActive: boolean): Promise<void> => {
    await api.patch(`/admin/api/v1/users/status?id=${id}`, { isActive });
};

export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`/admin/api/v1/users/delete?id=${id}`);
};
