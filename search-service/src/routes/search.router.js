import { Router } from "express";
import Middlewares from "../middlewares/index.js";
import SearchController from "../controllers/search.controller.js";
class SearchRouter {
    /**
     * @type {Router}
     */
    router = null;

    constructor() {
        this.router = Router();
        this.#routes();
    }

    #routes() {
        this.router.use(Middlewares.isAuthenticated);
        this.router.route("/posts").get(SearchController.searchPosts);
        // TODO: Implement search routes
    }
}

export default new SearchRouter().router;