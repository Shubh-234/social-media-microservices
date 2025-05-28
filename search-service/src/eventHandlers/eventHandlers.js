const logger = require('../utils/logger');
const SearchPost = require('../models/Search')

async function updateSearchAfterPost (event) {
    logger.warn("Entering update search after post creation event handler")
    try {
        const newSearch = new SearchPost({
            postId: event.postId,
            userId: event.userId,
            content: event.postContent
        })

        logger.info(event);

        await newSearch.save();
        logger.info(`Event complete, Search made ${newSearch._id}, user: ${newSearch.userId} , content : ${event.postContent}`)
    } catch (error) {
        logger.error(`Error in update after search post event handler ${error}`);
        throw error;
    }
}


//here event acts as a message
//to gain more understanding again look at the consume function you created in rabbit mq file in utils


async function updateSearchAfterPostDelete (event) {
    try {
        logger.warn("Entering update search after post deletion event handler");

        const postId = event.postId;
        const posts = await SearchPost.find({
            postId : postId
        })

        for (const post of posts) {
            await SearchPost.findByIdAndDelete(post._id);
        }


        logger.info(event);
        
        logger.info(`Event succesfull, search deleted corresponding to post ${postId}`)
    } catch (error) {
        logger.error(`Error in the search update after post deletion event handler ${error}`);
        throw error;
    }
}


module.exports = {updateSearchAfterPost,updateSearchAfterPostDelete}