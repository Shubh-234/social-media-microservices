const logger = require('../utils/logger');
const {validationRegistration,validationLogin} = require('../utils/validation')
const User = require('../models/User');
const {signTokens} = require('../utils/refreshToken');
const RefreshToken = require('../models/RefreshToken')
//register user

const registerUser = async (req,res) => {
    logger.info("Entering registration of user endpoint...")
    try {
        const {error} = validationRegistration(req.body);
        if(error){
            logger.warn("Validation error",error.details[0].message);
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            });
        }
        const {email,userName,password} = req.body;
        let user = await User.findOne({$or : [{email},{userName}]});
        if(user){
            logger.warn("User already exists");
            return res.status(400).json({
                success : false,
                message : "User already exists"
            })
        }
        const newUser = new User({userName,email,password});
        await newUser.save();
        logger.info("User saved successfully",newUser._id)
        const {accessToken,refreshToken} = await signTokens(newUser);

        res.status(201).json({
            success : true,
            message : "User registered successfully",
            newUser,
            accessToken,
            refreshToken
        })

    } catch (error) {
        logger.warn("error with registering user",error);
        res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }
}


//user login 

const loginUser = async (req,res) => {
    logger.info("Entering login of user endpoint...")
    try {
    const {error} = validationLogin(req.body);
    if(error){
        logger.warn(`user data while loggin in is not valid`,error.details[0].message);
        return res.status(400).json({
                success : false,
                message : error.details[0].message
        });

    }

    const {userName,password} = req.body;

    const user = await User.findOne({userName});
    if(!user){
        logger.warn("Invalid user credentials");
        return res.status(400).json({
            sucess: false,
            message : "Invalid credentials"
        })
    }

    const checkPassword = user.comparePassword(password);
    if(!checkPassword){
        logger.warm("invalid password while logging in");
        return res.status(400).json({
            success : false,
            message : "Invalid password"
        })
    }

    const {accessToken,refreshToken} = await signTokens(user);
    res.json({
        accessToken,
        refreshToken,
        userID : user._id
    });
    } catch (error) {
        logger.warn(`error while loggin in user `,error);
        return res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }
}

//refresh token

const refreshTokenController = async (req,res) => {
    logger.warn("Entering refresh token controller....");
    try {
        const {refreshToken} = req.body;
        if(!refreshToken){
            logger.warn(`no token found`);
            return res.status(400).json({
                success : false,
                message : 'No token provided'
        });
        }

        const storedToken = await RefreshToken.findOne({token : refreshToken});
        if(!storedToken || storedToken.expiresAt < new Date()){
            logger.warn(`token is invalid`);
            return res.status(401).json({
                success : false,
                message : "Invalid token"
            })
        }

        const tokenId = storedToken._id;
        const userId = storedToken.user._id;
        const user = await User.findById(userId);
        
        if(!user){
            logger.warn(`User corresponding to the token does not exists`);
            return res.status(401).json({
                success : false,
                message : "Invalid user"
            })
        }

        const {accessToken: newAccessToken,refreshToken: newRefreshToken} = signTokens(user);
        await RefreshToken.findByIdAndDelete(tokenId);

        res.json({
            accessToken : newAccessToken,
            refreshToken : newRefreshToken
        })

    } catch (error) {
        logger.warn(`error while refresh token controller: ${error}`);
        return res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }
}




//logout

const logoutUser = async (req,res) => {
    try {
        const {refreshToken} = req.boy;
        if(!refreshToken){
            logger.warn(`no token found`);
            res.status(400).json({
                success : false,
                message : "No token found"
            })
        }

        await RefreshToken.deleteOne({token: refreshToken});
        logger.warn(`refresh token deleted from database successfully`);

        res.status(200).json({
            success : false,
            message : "Logged out successfully"
        })
    } catch (error) {
        logger.warn(`error while loggin out`);
        return res.status(500).json({
            success : true,
            message : 'Internal server error'
        })
    }
}




module.exports = {registerUser,loginUser,refreshTokenController,logoutUser};