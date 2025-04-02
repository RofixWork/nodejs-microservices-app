import { Router } from "express";
import PostController from "../controllers/post.controller.js";
import Middlewares from "../middlewares/index.js";
import { postCreateSchema } from "../utils/validation.js";

class PostRouter {
  /**
   * @type {Router}
   */
  router;

  constructor() {
    this.router = Router();
    this.#routes();
  }

  #routes() {
    this.router.use(Middlewares.isAuthenticated);
    this.router
      .route("/")
      .get(PostController.all)
      .post(
        [Middlewares.joiValidation(postCreateSchema)],
        PostController.create
      );

    this.router.route("/:id").get([Middlewares.checkPostIdParam], PostController.get).delete([Middlewares.checkPostIdParam], PostController.delete)
  }
}

export default new PostRouter().router;
