import mongoose, { Model, Schema } from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt.js";

export interface User {
  email: string;
  password: string;
  userAgent?: string;
  verified: boolean;
}

// Define instance methods that each User document will have
interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

// Define the UserModel type, extending Mongoose's Model with User + UserMethods
interface UserModel extends Model<User, {}, UserMethods> {}

const userSchema = new Schema<User, UserModel, UserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // exclude by default when querying (security measure)
    },
    userAgent: String,
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true, // automatically add createdAt and updatedAt fields
  }
);

// Pre-save hook: runs before saving a document
userSchema.pre("save", async function (next) {
  // Only hash password if it was modified (e.g., new user or password change)
  if (this.isModified("password")) {
    this.password = await hashValue(this.password);
    next();
  }
});

userSchema.methods.comparePassword = async function (candidate: string) {
  return await compareValue(candidate, this.password);
};

// Helper function to remove sensitive fields when converting to JSON/Object
const removePassword = (_doc: any, ret: any) => {
  delete ret.password;
  delete ret.__v;
  return ret;
};

userSchema.set("toJSON", { transform: removePassword });
userSchema.set("toObject", { transform: removePassword });

const UserModel = mongoose.model<User, UserModel>("User", userSchema);

export default UserModel;
