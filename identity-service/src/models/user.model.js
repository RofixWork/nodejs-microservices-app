import { Schema, Model, model } from "mongoose";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from 'crypto'
import RefreshToken from "./refreshToken.model.js";
const UserSchema = new Schema(
  {
    username: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 255,
      lowercase: true,
    },
    password: {
      type: Schema.Types.String,
      required: true,
      trim: true,
      minlength: 8,
    },
    createdAt: {
      type: Schema.Types.Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    methods: {
      async comparePassword(password) {
        return await argon2.verify(this.password, password);
      },
      async generateTokens() {
        const accessToken = jwt.sign(
          { userId: this._id, username: this.username },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_LIFETIME }
        );

        const refreshToken = crypto.randomBytes(40).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

        await RefreshToken.create({
            user: this._id,
            token: refreshToken,
            expiresAt,
        })
        return { accessToken, refreshToken };
      },
    },
  }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await argon2.hash(this.password);
  }
  next();
});

UserSchema.index({ username: "text" });

/**
 * @type {Model}
 */
const User = model("User", UserSchema);

export default User;
