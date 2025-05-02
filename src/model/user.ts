import { Schema, Document, model, Model } from "mongoose";
import { IUser } from "../interfaces/interface";

const userSchema: Schema<IUser> = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      required: true,
      enum: ["Admin", "Student", "Instructor"],
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    token: {
      type: String,
    },
    additionalDetails: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = model<IUser>("User", userSchema);

export default User;
