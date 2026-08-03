export interface IUser {
  id: number;
  username: string;
  email: string;
  password?: string;
  phone: string;
  address?: string;
  googleId?: string;
  facebookId?: string;
  profilePicture?: string;
  role: 'customer' | 'admin' | 'support' | 'collector';
  isActive: boolean;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  id: number;
  nameEng: string;
  nameUrdu: string;
  todayPrice: number;
  categoryLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'pending' | 'bidding' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface IOrder {
  id: number;
  customerId: number;
  collectorId?: number;
  categoryId?: number;
  status: OrderStatus;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  scheduleTime: Date;
  approximateRaddiInKg: number;
  expectedPrice?: number;    // Customer's hint price (PKR)
  finalPrice?: number;       // Agreed bid price after negotiation
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields (optional, from queries)
  customerName?: string;
  collectorName?: string;
  categoryName?: string;
  activeBids?: IOrderBid[];
}

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'countered';

export interface IOrderBid {
  id: number;
  order_id: number;
  collector_id: number;
  bid_amount: number;
  counter_amount?: number;
  status: BidStatus;
  round: number;
  note?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields (optional)
  collectorName?: string;
  collectorPhone?: string;
}

export interface IChat {
  id: number;
  order_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: Date;
  senderName?: string;
}

export interface DriverLocation {
  driverId: number;
  socketId: string;
  longitude: number;
  latitude: number;
}

// Legacy — kept for backward compat
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
  status: 'active' | 'inactive' | 'expired' | 'featured';
  createdAt: Date;
  updatedAt: Date;
}