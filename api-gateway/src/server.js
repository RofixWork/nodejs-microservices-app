import "express-async-errors";
import "dotenv/config";
import express from "express";
import logger from "./utils/logger.js";
import Middlewares from "./middlewares/index.js";
import helmet from "helmet";
import cors from "cors";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import CustomError from "./errors/custom-error.js";
import { StatusCodes } from "http-status-codes";
import proxy from "express-http-proxy";
class Application {
  /**
   * @type {express.Express}
   */
  #app;
  #PORT = process.env.PORT || 3000;
  #messageRunning = `Server is running at: http://localhost:${this.#PORT}`;
  #reditClient;

  constructor() {
    this.#app = express();
    this.#reditClient = new Redis(process.env.REDIS_CLIENT);

    this.#reditClient.on("error", (err) => {
      logger.error(`Redis error: ${err}`);
    });

    //call methods
    this.#middlewares();
    this.#routes();
    this.#customMiddlewares();
  }

  #middlewares() {
    this.#app.use(express.json());
    this.#app.use(helmet());
    this.#app.use(cors());

    const rateLimiterRedis = new RateLimiterRedis({
      storeClient: this.#reditClient,
      keyPrefix: "middleware",
      points: 10,
      duration: 1, // in seconds,
    });

    this.#app.use(async (request, response, next) => {
      try {
        await rateLimiterRedis.consume(request.ip);
        next();
      } catch (error) {
        logger.warn(
          `Too many requests from ${request.ip}, please try again later`
        );
        throw new CustomError(
          "Too many requests, please try again later",
          StatusCodes.TOO_MANY_REQUESTS
        );
      }
    });

    //PROXY
    const proxyOptions = {
      /**
       *
       * @param {import("express").Request} req
       * @returns {String}
       */
      proxyReqPathResolver: function (req) {
        return req.originalUrl.replace("v1", "api");
      },
      proxyErrorHandler: function (err, res, next) {
        logger.error(`Proxy Error: ${err.message}`);
        next(err);
      },
    };

    this.#app.use(
      "/v1/auth",
      proxy(process.env.IDENTITY_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
          proxyReqOpts.headers["Content-Type"] = "application/json";
          return proxyReqOpts;
        },
        userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
          logger.info(
            `Response received from Identity service: ${proxyRes.statusCode}`
          );
          return proxyResData;
        },
      })
    );

    //post service proxy
    this.#app.use(
      "/v1/posts",
      Middlewares.authenticateToken,
      proxy(process.env.POST_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
          proxyReqOpts.headers["Content-Type"] = "application/json";
          proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
          return proxyReqOpts;
        },
        userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
          logger.info(
            `Response received from Post service: ${proxyRes.statusCode}`
          );
          return proxyResData;
        },
      })
    );
    //SEARCH service proxy
    this.#app.use(
      "/v1/search",
      Middlewares.authenticateToken,
      proxy(process.env.SEARCH_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
          proxyReqOpts.headers["Content-Type"] = "application/json";
          proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
          return proxyReqOpts;
        },
        userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
          logger.info(
            `Response received from Post service: ${proxyRes.statusCode}`
          );
          return proxyResData;
        },
      })
    );

    //MEDIA ROUTER
    this.#app.use(
      "/v1/media",
      Middlewares.authenticateToken,
      proxy(process.env.MEDIA_SERVICE_URL, {
        ...proxyOptions,
        proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
          proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;

          if (
            proxyReqOpts.headers["Content-Type"] &&
            !proxyReqOpts.headers["Content-Type"].startsWith(
              "multipart/form-data"
            )
          ) {
            proxyReqOpts.headers["Content-Type"] = "application/json";
          }
          proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
          return proxyReqOpts;
        },
        userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
          logger.info(
            `Response received from Media service: ${proxyRes.statusCode}`
          );
          return proxyResData;
        },
        parseReqBody: false
      })
    );
  }

  #customMiddlewares() {
    // custom
    this.#app.use(Middlewares.notFound);
    this.#app.use(Middlewares.errorHandler);
  }

  #routes() {}

  async start() {
    try {
      this.#app.listen(this.#PORT, () => {
        logger.info(this.#messageRunning);
        logger.info(
          `Identity Service running at ${process.env.IDENTITY_SERVICE_URL}`
        );
        logger.info(`Post Service running at ${process.env.POST_SERVICE_URL}`);
        logger.info(
          `Media Service running at ${process.env.MEDIA_SERVICE_URL}`
        );
        logger.info(
          `Search Service running at ${process.env.SEARCH_SERVICE_URL}`
        );
        logger.info(`Redis Service running at ${process.env.REDIS_CLIENT}`);
      });

      process.on("SIGINT", () => {
        this.#reditClient.quit();
        logger.info("Server shutting down gracefully");
        process.exit(0);
      });
    } catch (error) {
      logger.error(`❌ Error connecting to the database: ${error.message}`);
      process.exit(1);
    }
  }
}

const app = new Application();
app.start();
