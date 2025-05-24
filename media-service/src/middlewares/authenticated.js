const logger = require('../utils/logger');

const authenticatedReq = (req,res,next) => {
    const userId = req.headers['x-user-id'];
    if(!userId){
        return res.status(401).json({
            success : false,
            message : "Unauthenticated user accessing the route"
        })
    }
    req.user = {userId};
    next();
}

module.exports = {authenticatedReq};