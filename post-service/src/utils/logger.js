import winston from "winston";

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({
      stack: true,
    }),
    winston.format.json(),
    winston.format.prettyPrint()
  ),
  defaultMeta: { service: "post-service" },
  transports: [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }),
    new winston.transports.File({
        filename: 'combined.log',
      }),
      new winston.transports.File({
        filename: 'errors.log',
        level: 'error'
      })
  ]
});
export default logger;