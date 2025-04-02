import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger.js";
import {UnauthorizedAPIError} from "../errors/index.js";
import jwt from 'jsonwebtoken'
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
   * Not Found Middleware
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @param {import('express').NextFunction} next
   * @returns {import('express').Response}
   */
  static async authenticateToken(request, response, next) {
    const authHeader = request.headers['authorization'];

    if(!authHeader || !authHeader.startsWith('Bearer')) {
      logger.warn('Authentication required')
      throw new UnauthorizedAPIError('Authentication required')
    }
    const token = authHeader.split(" ")?.[1];

    if(!token) {
      logger.warn('Invalid token')
      throw new UnauthorizedAPIError('Invalid token')
    }
    try {
      console.log('HELO');
      
      const user = jwt.verify(token, process.env.JWT_SECRET);
      console.log(user);
      
      request.user = user;
      next();
    } catch (error) {
      logger.warn('Invalid token')
      throw new UnauthorizedAPIError('Invalid token')
    }
  }
}

export default Middlewares;
