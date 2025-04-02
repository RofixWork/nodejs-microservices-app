import { Router } from "express";
import MediaController from "../controllers/media.controller.js";
import upload from '../utils/multer.js';
import Middlewares from "../middlewares/index.js";
import logger from "../utils/logger.js";
import {BadRequestAPIError} from "../errors/index.js"
import multer from "multer";
class MediaRouter {
  /**
   * @type {Router}
   */
  router;
  #fileUpload = upload.single('media');

  constructor() {
    this.router = Router();
    this.#routes();
  }

  #routes() {
    this.router.use(Middlewares.isAuthenticated);
    this.router.get('/', MediaController.all)
    this.router.post("/upload", (req, res, next) => {
      this.#fileUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          logger.error("Error uploading file:", err);
          throw new BadRequestAPIError("Error Uploading File");
        } else if (err) {
          // An unknown error occurred when uploading.
          logger.error("Error uploading file:", err);
          throw new BadRequestAPIError("Error uploading file");
        }
        if(!req.file) {
          logger.error("No file uploaded");
          throw new BadRequestAPIError("No file uploaded");
        }

        next();
      })
    }, MediaController.uploadMedia);
    
  }
}

export default new MediaRouter().router;
