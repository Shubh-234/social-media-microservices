const logger = require('../utils/logger');

const handleErrors = (err,req,res,next) => {
    logger.error(err);

    res.status(err.status || 500).json({
        message : err.message || "Internal server error",
    })
};

module.exports = {handleErrors};