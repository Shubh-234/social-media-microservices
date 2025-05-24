const logger = require('../utils/logger');
const Post = require('../models/Post');
const {validationCreatePost} = require('../utils/validation')

async function invalidatePostCache(req,input) {

    const cachedKey = `post:${input}`;
    await req.redisClient.del(cachedKey);

    const keys = await req.redisClient.keys("posts:*");
    if(keys.length>0){
        await redisClient.del(...keys);
    }
}

const createPost = async (req,res) => {
    logger.info(`entering creat post controller....`);
    try {
        const {error} = validationCreatePost(req.body);
        if(error){
            logger.warn(`validation error while post creation`, error.details[0].message)
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            })
        }
        const {content,mediaIds} = req.body;
        

        const newPost = new Post({
            user : req.user.userId,
            content,
            mediaIds: mediaIds || []
        })

        await newPost.save();
        await invalidatePostCache(req,newPost._id.toString());
        
        logger.info(`post created successfully: ${newPost}`);
        res.status(201).json({
            success : true,
            message : "Post created successfully",
            newPost
        })
    } catch (error) {
        logger.warn(`error while creating post: ${error}`);
        return res.status(500).json({
            success : false,
            message : "Error while creating a post"
        });
    }
}

const getAllPost = async (req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;
        const startIndex = (page-1)*limit;
        const cachedKey = `posts:${page}, ${limit}`;
        const cachedPosts = await req.redisClient.get(cachedKey)

        if(cachedPosts){
            res.json(JSON.parse(cachedPosts));
        }

        const posts = await Post.find({}).sort({createdAt: -1}).skip(startIndex).limit(limit);
        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts/limit);
        
        const result = {
            currentPage : page,
            totalPosts: totalPosts,
            totalPages,
            posts,
        }

        //storing the result in the cache

        await req.redisClient.setex(cachedKey,300,JSON.stringify(result));

        res.status(200).json(result);

    } catch (error) {
        logger.error(`error while getting posts ${error}`);
        return res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }
}

const getPost = async (req,res) => {
    try {
        const postId = req.params.id
        const cachedKey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cachedKey);
        if(cachedPost){
            res.json(JSON.parse(cachedPost));
        }

        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({
                success : false,
                message : "Post not found"
            })
        }

        await req.redisClient.setex(cachedKey,3600,JSON.stringify(post));

        res.status(200).json({
            success : true,
            message : "retreieved post",
            post
        }
        )

    } catch (error) {
        logger.error(`error while getting post: ${error}`);
        return res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }
}

const deletePost = async (req,res) => {
    try {
        const post = await Post.findOneAndDelete({
            _id : req.params.id,
            user: req.user.userId
        })
        if(!post){
            return res.status(404).json({
                success : false,
                message : "Post not found"
            })
        }
        await invalidatePostCache(req,req.params.id);
        return res.status(202).json({
            success : true,
            message : "Post deleted successfuly"
        })
    } catch (error) {
        logger.error(`error while deleting the post ${error}`);
        return res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }
}

module.exports = {createPost,getAllPost,getPost,deletePost};