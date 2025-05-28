const logger = require('../utils/logger');
const Media = require('../models/Media');
const {deleteMediaFromCloudinary} = require('../utils/cloudinaryUtils')

const handlePostDeleted = async (event) => {
    console.log(event,`this is the event`);
    const {postId,mediaIds} = event;
    try {
        const mediaToDelete = await Media.find({
            _id : {$in : mediaIds}
        });

        for (const media of mediaToDelete ) {
            await deleteMediaFromCloudinary(media.publicId);
            await Media.findByIdAndDelete(media._id);
            logger.info(`deleted media ${media._id} associated with post ${postId}`)
        }
    } catch (error) {
        logger.error(`error in the event handler ${error}`);
    }
};

module.exports = {handlePostDeleted}