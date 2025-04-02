import Post from "../models/post.models.js";
import logger from "../utils/logger.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundAPIError } from "../errors/index.js";
import { publishEvent } from "../utils/rabbitmq.js";
class PostController {
  /**
   * @static
   * @param {import('express').Request} request
   * @returns {void}
   */
  static async #invalidatePostCache(request) {
    /**
     * @type {import('ioredis').Redis}
     */
    const redisClient = request.redisClient;

    const keys = await redisClient.keys("posts:*");

    if (keys.length) {
      await redisClient.del(...keys);
      logger.info("Post cache cleared successfully");
    }
  }
  /**
   * @static
   * @async
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @returns {import('express').Response}
   */
  static async all(request, response) {
    logger.info("Get All post endpoint hit...");
    const { userId } = request.user;

    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    /**
     * @type {import('ioredis').Redis}
     */
    const redisClinet = request.redisClient;
    const cachedKey = `posts:${page}:${limit}`;
    const cachedPosts = await redisClinet.get(cachedKey);
    if (cachedPosts) {
      return response.status(StatusCodes.CREATED).json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({ user: userId })
    .populate('user')
      .sort("-createdAt")
      .limit(limit)
      .skip(skip);
    const totalPosts = await Post.countDocuments({ user: userId });
    const result = {
      success: true,
      message: "Posts fetched successfully",
      posts,
      totatlPages: Math.ceil(totalPosts / limit),
      totalPosts,
      timestamp: new Date().toISOString(),
    };

    await redisClinet.setex(cachedKey, 60 * 5, JSON.stringify(result));
    return response.status(StatusCodes.CREATED).json(result);
  }

  /**
   * @static
   * @async
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @returns {import('express').Response}
   */
  static async get(request, response) {
    logger.info("Get Single post endpoint hit...");
    const { id: postId } = request.params;
    const { userId } = request.user;

    /**
     * @type {import('ioredis').Redis}
     */
    const redisClient = request.redisClient;
    const cachedKey = `post:${postId}`;

    const cachedPost = await redisClient.get(cachedKey);

    if (cachedPost) {
      return response.status(StatusCodes.OK).json({
        success: true,
        message: "Post fetched from cache",
        post: JSON.parse(cachedPost),
        timestamp: new Date().toISOString(),
      });
    }

    const post = await Post.findOne({ _id: postId, user: userId });

    if (!post) {
      logger.warn(`Post not found for user: ${userId} and id: ${postId}`);
      throw new NotFoundAPIError("Post not found");
    }
    await redisClient.setex(cachedKey, 60 * 5, JSON.stringify(post));

    return response.status(StatusCodes.OK).json({
      success: true,
      message: "Post fetched successfully",
      post: post,
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
  static async create(request, response) {
    logger.info("Create post endpoint hit...");
    const { userId } = request.user;
    const { content, mediaIds } = request.body;
    const post = await Post.create({
      user: userId,
      content,
      mediaIds: mediaIds || [],
    });

    // publish event
    await publishEvent('post.created', {
      postId: post?._id.toString(),
      userId,
      content,
    })
    PostController.#invalidatePostCache(request);
    logger.info(`Post created successfully: ${post}`);
    return response.status(StatusCodes.CREATED).json({
      success: true,
      message: "Post created successfully",
      post,
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
  static async delete(request, response) {
    logger.info("Delete post endpoint hit...");
    const { id: postId } = request.params;
    const { userId } = request.user;
    const cachedKey = `post:${postId}`;
    /**
     * @type {import('ioredis').Redis}
     */
    const redisClient = request.redisClient;

    const post = await Post.findOne({ _id: postId, user: userId });
    if (!post) {
      logger.warn(`Post not found for user: ${userId} and id: ${postId}`);
      throw new NotFoundAPIError("Post not found");
    }

    //publish event
    await publishEvent("post.deleted", {
      postId,
      userId,
      mediaIds: post.mediaIds,
      timestamp: new Date().toISOString(),
    })

    await Post.deleteOne({ _id: postId, user: userId });

    await redisClient.del(cachedKey);
    PostController.#invalidatePostCache(request);
    logger.info("Post deleted successfully");
    return response.status(StatusCodes.OK).json({
      success: true,
      message: "Post deleted successfully",
      timestamp: new Date().toISOString(),
    });
  }
}

export default PostController;
