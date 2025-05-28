//connecting to db
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const helmet = require('helmet')
const cors = require('cors');
const path = require('path');
const {RateLimiterRedis} = require('rate-limiter-flexible');
const Redis = require('ioredis')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const routes = require('./routes/identity-service');
const {handleErrors} = require('./middlewares/errorHandler')

dotenv.config({ path: path.resolve(__dirname, '.env') });
const app = express();

const PORT = process.env.PORT;

mongoose.connect(process.env.mongo_url).
then(() => logger.info("Connected to mongo db")).
catch((e) => logger.error("Mongo db connection error",e));


const redisClient = new Redis(process.env.redis_url || 'redis://localhost:6379')


//middlewares
app.use(helmet());
app.use(express.json());
app.use(cors());
app.use((req,res,next) => {
    logger.info(`received ${req.method} from url ${req.url}`);
    logger.info(`request body : ${req.body}`);
    next();
})




//ddos protection and rate limiting

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration : 1,
})

app.use((req,res,next) => {
    rateLimiter.consume(req.id).then(()=> next()).catch(()=> {
        logger.warn(`rate limit exceeded at ip ${req.ip}`)
        res.status(429).json({
            success : false,
            message : "Too many api requests"
        })
    })
})

//rate limiting of sensitive apis via ip addresses
const sensitiveRateLimit = rateLimit({
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

//using sensitve rate limiter
app.use('/api/auth/register',sensitiveRateLimit);

app.use('/api/auth',routes);

app.use(handleErrors);

app.listen(PORT,()=> 
    logger.info(`identity service is running at port ${PORT}`)
);

//unhandles promise rejection
process.on("Unhandled rejection promise",(promise,reason)=> {
    logger.error(`Unhandled rejection at promise ${promise}, reason: ${reason}`)
})