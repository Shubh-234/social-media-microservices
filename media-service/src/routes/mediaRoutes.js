const express = require('express');
const router = express.Router();
const {authenticatedReq}  = require('../middlewares/authenticated');
const {uploadMedia} = require('../controllers/mediaController');
const multer = require('multer');
const logger = require('../utils/logger')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");


router.post('/upload',authenticatedReq,(req,res,next) => {
    upload(req,res,function(err){
        if(err instanceof multer.MulterError ){
            logger.error(`multer error while uploading media ${err}`);
            return res.status(400).json({
              success : false,
              message : "Multer error occurred while uploading",
              error : err.message,
              stack : err.stack
            })
        }else if(err){
          return res.status(500).json({
            success : false,
            message : "Internal server error while uploading",
            error : err.message,
            stack : err.stack
          })
        }
        if(!req.file){
          return res.status(400).json({
            success : false,
            message : 'No file provided'
          });
        }
        next();
    });
},uploadMedia)




module.exports = router;