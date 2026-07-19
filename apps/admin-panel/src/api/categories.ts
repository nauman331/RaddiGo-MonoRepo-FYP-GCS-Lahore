import api from './axios';
import type { ICategory, PaginationMeta } from '../types';

export const getCategories = async (
  page = 1,
  limit = 50
): Promise<{ categories: ICategory[]; pagination: PaginationMeta }> => {
  const { data } = await api.get(`/category/api/v1/categories?page=${page}&limit=${limit}`);
  return data;
};

export const createCategory = async (name: string, categoryLogo?: string): Promise<void> => {
  await api.post('/category/api/v1/categories', { name, categoryLogo });
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete('/category/api/v1/categories', { data: { id } });
};
