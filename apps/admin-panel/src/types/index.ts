// ---- User & Auth ----
export interface IUser {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer' | 'collector';
  isVerified: boolean;
  isActive: boolean;
  address?: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ---- Wallet ----
export interface IWallet {
  user_id: number;
  username: string;
  email: string;
  phone: string;
  balance: number | string;
  updated_at: string;
}

export interface IWalletDetail {
  user_id: number;
  balance: number | string;
  updated_at: string;
}

// ---- Transactions ----
export type TransactionType = 'deposit' | 'withdrawal';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface ITransaction {
  id: number;
  user_id: number;
  username?: string;
  email?: string;
  amount: number | string;
  type: TransactionType;
  status: TransactionStatus;
  note?: string;
  admin_id?: number;
  created_at: string;
  updated_at?: string;
}

// ---- Category ----
export interface ICategory {
  id: number;
  nameEng: string;
  nameUrdu: string;
  todayPrice: number;
  categoryLogo?: string;
  createdAt?: string;
}

// ---- API Responses ----
export interface ApiResponse<T = unknown> {
  message?: string;
  error?: string;
  data?: T;
}

export interface LoginResponse {
  token: string;
  userId: number;
  role: string;
  isOk: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---- Auth Context ----
export interface AuthState {
  token: string | null;
  user: IUser | null;
  isLoading: boolean;
}
