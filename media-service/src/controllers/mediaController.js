const Media = require('../models/Media');
const {uploadMediaToCloudinary} = require('../utils/cloudinaryUtils')
const logger = require('../utils/logger')


const uploadMedia = async (req,res) => {
    logger.info(`Entering the upload media controller....`)
    try {
        console.log(req.file, "req.filereq.file");
        if(!req.file){
            return res.status(400).json({
                success : false,
                message : "File not privided"
            })
        }
        const {originalname,mimetype,buffer} = req.file;
        const userId = req.user.userId;

        logger.info(`uploading the file ${originalname} with the type ${mimetype}`);
        logger.info(`user is ${req.user.userId}`);
        logger.info(`uploading to cloudinary is starting...`)

        const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
        logger.info(
      `Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`
    );
        const newMedia = new Media({
            publicId: cloudinaryUploadResult.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url : cloudinaryUploadResult.secure_url,
            userId: userId
        })

        await newMedia.save();
        res.status(201).json({
            success : true,
            message : "Media uploaded",
            mediaId: newMedia._id,
            url : newMedia.url
        })
        
    } catch (error) {
        logger.error(`error uploading media in the media controller`);
        return res.status(500).json({
            success : false,
            message : "Internal server error",
            error
        })
    }
}

module.exports = {uploadMedia}