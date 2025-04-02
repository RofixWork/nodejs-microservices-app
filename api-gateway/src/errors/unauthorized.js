import { StatusCodes } from "http-status-codes";
import CustomError from "./custom-error.js";

class UnauthorizedAPIError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.UNAUTHORIZED;
    }
}

export default UnauthorizedAPIError;