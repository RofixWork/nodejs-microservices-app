import { StatusCodes } from "http-status-codes";
import CustomError from "./custom-error.js";

class BadRequestAPIError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.BAD_REQUEST;
    }
}

export default BadRequestAPIError;