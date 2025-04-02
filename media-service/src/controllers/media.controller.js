import logger from "../utils/logger.js";
import { BadRequestAPIError, NotFoundAPIError } from "../errors/index.js";
import Cloudinary from "../utils/cloudinary.js";
import Media from "../models/media.model.js";
import { StatusCodes } from "http-status-codes";
class MediaController {
  /**
   * @static
   * @async
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @returns {import('express').Response}
   */
  static async uploadMedia(request, response) {
    logger.info("Media Upload endpoint hit...");
    const file = request.file;
    const { userId } = request.user;

    if (!file) {
      logger.warn("No file uploaded");
      throw new BadRequestAPIError("No file uploaded");
    }
    const { originalname, mimetype } = file;
    logger.info(`File Details: name = ${originalname}, mimeType: ${mimetype}`);
    logger.info("starting upload to Cloundinary: ");
    const cloudinaryResponse = await Cloudinary.uploadMedia(file);

    logger.info("File uploaded to Cloudinary");
    logger.info("Create a Media Record");
    const media = await Media.create({
      publicId: cloudinaryResponse.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryResponse.secure_url,
      userId,
    });
    logger.info("Media record created successfully");

    return response.status(StatusCodes.CREATED).json({
      success: true,
      message: "Media uploaded successfully",
      mediaId: media?._id,
      mediaUrl: media?.url,
      timestamp: new Date().toISOString(),
    });
  }
  /**
   * @static
   * @async
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @returns {import('express').Response}
   */
  static async all(request, response) {
    logger.info("All Media endpoint hit...");
    const { userId } = request.user;

    const medias = await Media.find({ userId });
    if (!medias.length) {
      logger.warn("No media found for this User");
      throw new NotFoundAPIError("No media found for this User");
    }

    return response.status(StatusCodes.OK).json({
      success: true,
      message: "All media fetched successfully",
      medias,
      nbHits: medias.length,
      timestamp: new Date().toISOString(),
    });
  }
}

export default MediaController;
