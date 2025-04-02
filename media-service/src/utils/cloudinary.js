import {v2 as cloudinary} from 'cloudinary'
import logger from './logger.js';
cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});
class Cloudinary {
    /**
     * Description
     * @param {File} filePath
     * @returns {Promise<import("cloudinary").UploadApiResponse>}
     */
    static async uploadMedia(file) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                resource_type: "auto"
            }, (error, result) => {
                if (error) {
                    logger.error("Error uploading to Cloudinary:", error);
                    reject(error);
                } else {
                    resolve(result);
                    logger.info("File uploaded to Cloudinary:", result);
                }
            })
            uploadStream.end(file.buffer);
        })
    }

    /**
     * Description
     * @param {string} publicId
     * @returns {Promise<any>}
     */
    static async deleteMedia(publicId) {
        return cloudinary.uploader.destroy(publicId)
    }
}
export default Cloudinary;