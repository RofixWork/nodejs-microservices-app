import Search from "../models/search.model.js";
import logger from "../utils/logger.js";
import { NotFoundAPIError, BadRequestAPIError } from "../errors/index.js";
class SearchController {
  /**
   * @static
   * @async
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @returns {import('express').Response}
   */
  static async searchPosts(request, response) {
    logger.info("Search endpoint hit...");
    const { query } = request.query;

    if (!query) {
      logger.warn("No search query provided");
      throw new BadRequestAPIError("No search query provided");
    }

    const results = await Search.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    if(!results.length) {
      logger.warn("No search results found for this query");
      throw new NotFoundAPIError("No search results found for this query");
    }

    return response.status(200).json({
      success: true,
      message: "Search results fetched successfully",
      results,
      timestamp: new Date().toISOString(),
    });
  }
}

export default SearchController;
