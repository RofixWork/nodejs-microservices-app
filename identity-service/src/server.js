import "express-async-errors";
import "dotenv/config";
import express from "express";
import connectDB from "./db/connect.js";
import logger from "./utils/logger.js";
import indentityRouter from "./routes/indentity.router.js";
import Middlewares from "./middlewares/index.js";
import helmet from "helmet";
import cors from "cors";
import Redis  from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import CustomError from "./errors/custom-error.js";
import { StatusCodes } from "http-status-codes";
class Application {
  /**
   * @type {express.Express}
   */
  #app;
  #PORT = process.env.PORT || 3001;
  #messageRunning = `Server is running at: http://localhost:${this.#PORT}`;
  #connectionString = process.env.MONGO_URI;
  #reditClient;

  constructor() {
    this.#app = express();
    this.#reditClient = new Redis(process.env.REDIS_CLIENT);

    //call methods
    this.#middlewares();
    this.#routes();
    this.#customMiddlewares();
  }

  #middlewares() {
    this.#app.use(express.json());
    this.#app.use(helmet());
    // {
    //     allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    //     methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH']
    // }
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
  }

  #customMiddlewares() {
    // custom
    this.#app.use(Middlewares.notFound);
    this.#app.use(Middlewares.errorHandler);
  }

  #routes() {
    this.#app.use("/api/auth", indentityRouter);
  }

  async start() {
    try {
      await connectDB(this.#connectionString);
      this.#app.listen(this.#PORT, () => logger.info(this.#messageRunning));

      process.on('SIGINT', () => {
        this.#reditClient.quit();
        logger.info('Server shutting down gracefully');
        process.exit(0);
      })
    } catch (error) {
      logger.error(`❌ Error connecting to the database: ${error.message}`);
      process.exit(1);
    }
  }
}

const app = new Application();
app.start();
