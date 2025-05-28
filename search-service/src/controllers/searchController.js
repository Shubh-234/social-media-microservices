const logger = require('../utils/logger');
const SearchPost = require('../models/Search');

const searchPostController = async (req,res) => {
    logger.info(`Entering the searchPost controller...`)
    try {
        const {query} = req.query;

        const cacheKey = `searchquery:${query.trim().toLowerCase()}`;

        const cacheResults = await req.redisClient.get(cacheKey);

        if(cacheResults){
            const parsedResults = JSON.parse(cacheResults);
            if(parsedResults){
                logger.info(`cache hit: ${query}`);
                return res.json(parsedResults);
            }
        }
        const results = await SearchPost.find({
            $text : {$search : query}
            //search the indexed fields in mongo db database
        },{
            score : {$meta : "textScore"}
            //score acc to text match 
        }).sort({ score: { $meta: "textScore" } }).limit(10);

         if(results && results.length>0){
        logger.info(`Cache miss: queried DB and cached results for "${query}"`);
            req.redisClient.setex(cacheKey,600,JSON.stringify(results));
         }else{
            req.redisClient.setex(cacheKey,600,JSON.stringify([]));
         }

        res.json(results);
    } catch (error) {
        logger.error(`error in the search controller ${error}`);
        return res.status(500).json({
            success : true,
            message : "Internal server error"
        })
    }
}

module.exports = {searchPostController}