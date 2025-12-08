import mongoose, { Schema } from "mongoose";

const hotelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: String, // here user come from clerk
      required: true,
      ref: "User",
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Hotel = mongoose.model("Hotel", hotelSchema);
