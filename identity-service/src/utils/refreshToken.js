const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const RefreshToken = require('../models/RefreshToken')
const dotenv = require('dotenv');
const path = require('path')

dotenv.config({path : path.resolve(__dirname,'../.env')});

const signTokens = async (user) => {
    const accessToken = jwt.sign({
        userId : user._id,
        userName : user.userName
    }, process.env.jwt_secret, {expiresIn : '60m'} );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    await RefreshToken.create({
        token : refreshToken,
        user: user._id,
        expiresAt 
    })

    return {accessToken,refreshToken}
}



module.exports = {signTokens}