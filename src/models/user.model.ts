import mongoose, {Document} from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  role: "user" | "admin" | "support";
  googleId?: string;
  facebookId?: string;
  profilePicture?: string;
  token?: string;
  isVerified: boolean;
  tokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin', 'support'], default: 'user' },
    address: { type: String, default: "" },
    googleId: { type: String, default: "" },
    facebookId: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    token: { type: String, default: "" },
    isVerified: { type: Boolean, required: true, default: false },
    tokenExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
})

export const User = mongoose.model<IUser>("User", UserSchema);