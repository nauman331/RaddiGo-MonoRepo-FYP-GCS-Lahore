import mongoose, { Document } from "mongoose";

export interface Product extends Document {
    title: String,
    description: String,
    price: Number,
    thumbnail: String,
    category: String,
    status: "pending" | "active" | "featured",
    pictures: [String],

}