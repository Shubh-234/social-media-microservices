const express = require('express');
const router = express.Router();
const {registerUser,loginUser} = require('../controllers/identity-controllers')


router.post('/register',registerUser);
router.post('/login',loginUser);


module.exports = router;