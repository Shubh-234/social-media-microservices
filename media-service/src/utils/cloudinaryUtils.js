const cloudinary = require('cloudinary').v2;
const logger = require('./logger');
const dotenv = require('dotenv');
const path = require('path')

dotenv.config({
    path : path.resolve(__dirname,'../.env')
})

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key : process.env.api_key,
    api_secret : process.env.api_secret
})

const uploadMediaToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "auto"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        uploadStream.end(file.buffer);
    });
};


const deleteMediaFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        logger.info(`Media is successfuly deleted`);
        return result
    } catch (error) {
        logger.error(`errror deleting media from cloudinary ${error}`);
        throw error;
    }
}


module.exports = {uploadMediaToCloudinary,deleteMediaFromCloudinary}