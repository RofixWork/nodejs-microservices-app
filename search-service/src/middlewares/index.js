import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger.js";
import Joi from "joi";
class Middlewares {
  /**
   * Error Hander Found Middleware
   * @param {Error} error
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @param {import('express').NextFunction} next
   * @returns {import('express').Response}
   */
  static errorHandler(error, request, response, next) {
    logger.error(error.stack);
    const customErrror = {
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
    };

    return response
      .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
      .json(customErrror);
  }
  /**
     * Authentication Middleware
     * @param {import('express').Request} request
     * @param {import('express').Response} response
     * @param {import('express').NextFunction} next
     * @returns {import('express').Response}
     */
    static async isAuthenticated(request, response, next) {
      const userId = request.headers["x-user-id"];
  
      if (!userId) {
        logger.warn("Authentication required");
        throw new UnauthorizedAPIError("Authentication required");
      }
  
      request.user = { userId };
      next();
    }
  /**
   * Not Found Middleware
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @param {import('express').NextFunction} next
   * @returns {import('express').Response}
   */
  static notFound(request, response, next) {
    logger.warn(`Route < ${request.url} > not found`);
    return response.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: `Route < ${request.url} > not found`,
      timestamp: new Date().toISOString(),
    });
  }
  /**
   * Validation Middleware
   * @param {Joi.Schema} schema
   * @returns {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => import('express').Response | import('express').NextFunction}
   */
  static joiValidation(schema) {
    /**
     * @param {import('express').Request} request
     * @param {import('express').Response} response
     * @param {import('express').NextFunction} next
     * @returns {import('express').Response || import('express').NextFunction}
     */
    return (request, response, next) => {
      const { error } = schema.validate(request.body, {abortEarly: false});

      if (error) {
        logger.warn(`Validation Error: ${error.details[0].message}`);
        const errorMessages = error.details.map((err) => err.message);

        return response.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Validation Errors",
          errors: errorMessages,
          timestamp: new Date().toISOString(),
        });
      }
      next();
    };
  }
}

export default Middlewares;
