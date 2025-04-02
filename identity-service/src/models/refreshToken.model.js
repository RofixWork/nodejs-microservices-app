import { Schema, Model, model } from "mongoose";
const RefreshTokenSchema = new Schema(
  {
    token: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Schema.Types.Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * @type {Model}
 */
const RefreshToken = model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
