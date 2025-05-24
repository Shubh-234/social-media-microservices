const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path  = require('path');

dotenv.config({path : path.resolve(__dirname,'../.env')});

const validateToken = (req,res,next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token){
        logger.warn(`access attempted without token`);
        return res.status(401).json({
            success : false,
            message : "Authentication required"
        })
    }

    jwt.verify(token,process.env.jwt_secret,(err,user) => {
        if(err){
            return res.status(429).json({
                success : false,
                message : "Invalid token"
            })
        }
        req.user = user;
        next();
    });

}

module.exports = {validateToken};