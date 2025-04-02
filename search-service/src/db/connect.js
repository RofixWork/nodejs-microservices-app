import { connect } from "mongoose"
import logger from "../utils/logger.js";
const connectDB = async (uri) => {
    await connect(uri);
    logger.info("Connected to the database");
}

export default connectDB;