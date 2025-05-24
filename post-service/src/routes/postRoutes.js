const {createPost,getAllPost,getPost,deletePost} = require('../controllers/postController');
const {authenticatedReq} = require('../middlewares/authenticated')
const express = require('express');

const router = express.Router();

router.use(authenticatedReq);

router.post('/create-post',createPost);
router.get('/posts',getAllPost);
router.get('/post/:id',getPost);
router.delete('post/delete/:id',deletePost);



module.exports = router;