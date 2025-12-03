import mongoose, {Document} from "mongoose";

export interface IChat extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    message: string;
    timestamp: Date;
    isRead: boolean;
    pictures?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ChatSchema = new mongoose.Schema<IChat>({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    pictures: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
})

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);