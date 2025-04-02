import { model, Schema, Model } from "mongoose";

const MediaSchema = new Schema(
  {
    publicId: {
      type: Schema.Types.String,
      required: true,
      unique: true,
    },
    originalName: {
      type: Schema.Types.String,
      required: true,
    },
    mimeType: {
      type: Schema.Types.String,
      required: true,
    },
    url: {
      type: Schema.Types.String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @type {Model}
 */
const Media = model("Media", MediaSchema);

export default Media;
