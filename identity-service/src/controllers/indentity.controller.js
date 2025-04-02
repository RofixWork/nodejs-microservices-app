import logger from "../utils/logger.js";
import User from "../models/user.model.js";
import { UnauthorizedAPIError } from "../errors/index.js";
import { StatusCodes } from "http-status-codes";
import RefreshToken from "../models/refreshToken.model.js";
class IdentityController {
  /**
   * Register
   * @static
   * @async
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @returns {import('express').Response}
   */
  static async register(request, response) {
    logger.info("Register endpoint hit...");
    const { username, email, password } = request.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists");
      throw new ConflictAPIError("User already exists");
    }

    user = await User.create({ username, email, password });
    logger.info("User has been created successfully");

    const { accessToken, refreshToken } = await user.generateTokens();
    return response.status(StatusCodes.CREATED).json({
      success: true,
      message: "User has been created successfully",
      accessToken,
      refreshToken,
      timestamp: new Date().toISOString(),
    });
  }
  /**
   * Login
   * @static
   * @async
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @returns {import('express').Response}
   */
  static async login(request, response) {
    logger.info("Login endpoint hit...");
    const { email, password } = request.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      logger.warn("Invalid credentials");
      throw new UnauthorizedAPIError("Invalid credentials");
    }

    //remove all refresh tokens
    await RefreshToken.deleteOne({user: user._id});
    const { accessToken, refreshToken } = await user.generateTokens();
    return response.status(StatusCodes.OK).json({
      success: true,
      message: "User has been login successfully",
      accessToken,
      refreshToken,
      userId: user?._id,
      timestamp: new Date().toISOString(),
    });
  }
  /**
   * Refresh Token
   * @static
   * @async
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @returns {import('express').Response}
   */
  static async refreshToken(request, response) {
    const { refresh_token } = request.body;

    if (!refresh_token?.trim()) {
      logger.warn("missing refresh token");
      throw new UnauthorizedAPIError("Missing refresh token");
    }
    const token = await RefreshToken.findOne({ token: refresh_token });

    if (!token || token.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      throw new UnauthorizedAPIError("Invalid or expired refresh token");
    }

    const user = await User.findById(token.user);
     //remove refresh tokens
     await RefreshToken.deleteOne({_id: token._id, user: user._id});
     logger.info("REMOVE OLD REFRESH TOKEN TO THIS USER: " + user._id);
    const { accessToken, refreshToken } = await user.generateTokens();
    // logger
    logger.info("NEW REFRESH TOKENS GENERATED FOR THIS USER: " + user._id);
    return response.status(StatusCodes.OK).json({
      success: true,
      message: "User has been logged out successfully",
      accessToken,
      refreshToken,
      timestamp: new Date().toISOString(),
    });
  }
  /**
   * Logout
   * @static
   * @async
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @returns {import('express').Response}
   */
  static async logout(request, response) {
    const { refresh_token } = request.body;

    if (!refresh_token?.trim()) {
      logger.warn("missing refresh token");
      throw new UnauthorizedAPIError("Missing refresh token");
    }
    const token = await RefreshToken.findOne({ token: refresh_token });

    if (!token || token.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      throw new UnauthorizedAPIError("Invalid or expired refresh token");
    }

    //remove refresh tokens
    await RefreshToken.deleteOne({_id: token._id});
    logger.info(`User (${token.user}) logged out, refresh token removed.`);

    return response.status(StatusCodes.OK).json({
      success: true,
      message: "User has been logged out successfully",
      timestamp: new Date().toISOString(),
    });
  }
}

export default IdentityController;
