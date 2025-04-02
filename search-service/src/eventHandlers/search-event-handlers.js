
import Search from "../models/search.model.js";
import logger from "../utils/logger.js";
const searchPostsHandler = async event => {
    try {
        const {postId, userId, content} = event;
        if(!postId || !userId || !content) {
            logger.error("Invalid event payload");
            return;
        }
        await Search.create({
            postId,
            userId,
            content,
        })
        logger.info(`Search created successfully: ${search}`);
    } catch (error) {
        logger.error("Error processing search post event:", error);
        
    }
    
}

const searchDeletePostHandler = async (event) => {
    try {
        const {postId, userId} = event;

        if(!postId ||!userId) {
            logger.error("Invalid event payload");
            return;
        }

        await Search.deleteOne({
            postId,
            userId,
        })
        logger.info(`Search deleted successfully: ${postId}`);
    } catch (error) {
        
        logger.error("Error processing search delete post event:", error);
    }
}
export {searchPostsHandler, searchDeletePostHandler}