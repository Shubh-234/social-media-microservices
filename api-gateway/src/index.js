const express = require('express')
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet')
const Redis = require('ioredis')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const logger = require('./utils/logger')
const proxy = require('express-http-proxy');
const path = require('path');
const {validateToken} = require('./middlewares/authenticated')

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet())
app.use(cors())
app.use(express.json())

const redisClient = new Redis(process.env.redis_url)

//rate limiting
const rateLimitOptions = rateLimit({
    windowMs: 15*60*1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders : false,
    handler : (req,res) => {
        logger.warn(`rate limit exceeded for ip ${req.ip}`)
        res.status(429).json({
            success : false,
            message : "Too many requests"
        })
    },
    store: new RedisStore({
        sendCommand : (...args) => redisClient.call(...args)
    }),
})

app.use(rateLimitOptions);
app.use((req,res,next) => {
    logger.info(`received ${req.method} from url ${req.url}`);
    logger.info(`request body : ${req.body}`);
    next();
})

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler : (err,res,next) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({
            success : false,
            message : "Internal server error"
        })
    }
}

app.use('/v1/auth',proxy(process.env.IDENTITY_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts,srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
}))


app.use('/v1/post',validateToken,proxy(process.env.POST_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts,srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from post service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
}))

app.use('/v1/media',validateToken,proxy(process.env.MEDIA_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts,srcReq) => {
        proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
        if(!srcReq.headers["content-type"].startsWith("multipart/form-data")){
            proxyReqOpts.headers["Content-Type"] = "application/json";
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from post service: ${proxyRes.statusCode}`
      );

      return proxyResData;
    },
}))


app.listen(PORT,()=> {
    logger.info(`api gateway is running at port ${PORT}`);
    logger.info(`Identity service is running at url ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Post service is running at url ${process.env.POST_SERVICE_URL}`);
    logger.info(`Redis url: ${process.env.REDIS_URL}`)
})