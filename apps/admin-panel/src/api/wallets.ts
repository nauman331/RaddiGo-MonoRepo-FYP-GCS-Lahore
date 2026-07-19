import api from './axios';
import type { IWallet, IWalletDetail, ITransaction } from '../types';

export const getAllWallets = async (): Promise<IWallet[]> => {
  const { data } = await api.get('/admin/api/v1/wallets');
  return data.wallets;
};

export const getUserWallet = async (
  userId: number
): Promise<{ wallet: IWalletDetail; transactions: ITransaction[] }> => {
  const { data } = await api.get(`/admin/api/v1/wallet/user?userId=${userId}`);
  return { wallet: data.wallet, transactions: data.transactions };
};

export const getPendingTransactions = async (): Promise<ITransaction[]> => {
  const { data } = await api.get('/admin/api/v1/wallet/pending');
  return data.transactions;
};

export const approveTransaction = async (id: number): Promise<void> => {
  await api.post(`/admin/api/v1/wallet/approve?id=${id}`);
};

export const rejectTransaction = async (id: number, note?: string): Promise<void> => {
  await api.post(`/admin/api/v1/wallet/reject?id=${id}`, { note });
};
