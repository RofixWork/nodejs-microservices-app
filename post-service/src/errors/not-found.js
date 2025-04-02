import { StatusCodes } from "http-status-codes";
import CustomError from "./custom-error.js";

class NotFoundAPIError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.NOT_FOUND;
    }
}

export default NotFoundAPIError;