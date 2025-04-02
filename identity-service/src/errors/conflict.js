import { StatusCodes } from "http-status-codes";
import CustomError from "./custom-error.js";

class ConflictAPIError extends CustomError {
    constructor(message) {
        super(message);
        this.statusCode = StatusCodes.CONFLICT;
    }
}

export default ConflictAPIError;