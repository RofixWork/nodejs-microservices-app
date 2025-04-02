import Media from "../models/media.model.js";
import Cloudinary from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

const handlePostDeleted = async (event) => {
    try {
        const { mediaIds, userId, postId } = event;

  if(!mediaIds || !userId || !postId) {
    logger.error("Invalid event payload");
    return;
  }

  const medias = await Media.find({
    _id: { $in: mediaIds },
    userId,
  });
  if (medias.length) {
    await Promise.all(
      medias.map((media) => Cloudinary.deleteMedia(media.publicId))
    );
    await Media.deleteMany({ _id: { $in: mediaIds }, userId });
    logger.info(
      `Deleted ${medias.length} media for user: ${userId} and post: ${postId}`
    );
  }
  logger.info("process delete post finished...");
    } catch (error) {
        logger.error("Error handling post deleted event:", error);
    }
  
};

export { handlePostDeleted };
