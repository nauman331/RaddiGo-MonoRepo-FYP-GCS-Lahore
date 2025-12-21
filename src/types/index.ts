export interface IUser {
  id: number;
  username: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'admin' | 'support' | 'collector';
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAd {
  id: number;
  adImages?: string;
  title: string;
  description: string;
  price: number;
  location: string;
  userId: number;
  categoryId: number;
  startDate: Date;
  endDate: Date;
  status: "active" | "inactive" | "expired" | "featured";
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  id: number;
  name: string;
  categoryLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverLocation {
  driverId: number;
  socketId: string;
  longitude: number;
  latitude: number;
}