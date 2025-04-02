import { Router } from "express";
import IdentityController from "../controllers/indentity.controller.js";
import Middlewares from "../middlewares/index.js";
import { UserLoginSchema, UserRegisterSchema } from "../utils/validation.js";
class IdentityRouter {
  /**
   * @type {Router}
   */
  router;

  constructor() {
    this.router = Router();
    this.#routes();
  }

  #routes() {
    this.router
      .route("/register")
      .post(
        [Middlewares.joiValidation(UserRegisterSchema)],
        IdentityController.register
      );
      this.router
      .route("/login")
      .post(
        [Middlewares.joiValidation(UserLoginSchema)],
        IdentityController.login
      );
      this.router
      .route("/refreshToken")
      .post(
        IdentityController.refreshToken
      );
      this.router
      .route("/logout")
      .post(
        IdentityController.logout
      );
  }
}

export default new IdentityRouter().router;
