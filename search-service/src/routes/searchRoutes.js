const express = require('express');
const router = express.Router();
const {searchPostController} = require('../controllers/searchController')
const {authenticatedReq} = require('../middlewares/authenticated')

router.use(authenticatedReq);

router.get('/get', searchPostController);



module.exports = router;