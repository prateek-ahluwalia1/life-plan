import mongoose, { Document, model, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string;
  isVerified: boolean;
  otpHash?: string | null;
  otpExpiry?: Date | null;
  otpRequestedAt?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpiry?: Date | null;
}

const userSchema: Schema<IUser> = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      required: function (this: any) {
        return !this.googleId;
      },
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    otpRequestedAt: {
      type: Date,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const transformed = ret as unknown as Record<string, unknown>;
    delete transformed.password;
    delete transformed.otpHash;
    delete transformed.passwordResetTokenHash;
    return transformed;
  },
});

export default model<IUser>("User", userSchema, "User");
