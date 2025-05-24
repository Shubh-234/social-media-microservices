const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const {Redis} = require('ioredis');
const mongoose = require('mongoose');
const path = require('path')


const logger = require('./utils/logger');
const {handleErrors} = require('./middlewares/errorHandler');
const postRoutes = require('./routes/postRoutes');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.port;

try {
    mongoose.connect(process.env.mongo_url).
   then(() => logger.info(`conntected to mongo db`)).
   catch(() => logger.error(`unable to connect to mongo db`));
} catch (error) {
    console.log(error)
}

const redisClient = new Redis(process.env.redis_url);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req,res,next) => {
    logger.info(`Received ${req.method} request to url : ${req.url}`);
    logger.info(`request body: ${req.body}`);
    next();
})


//implement ip based rate limiting for sensitive endpoints


//routes
app.use('/api/post', (req, res, next) => {
    req.redisClient = redisClient;  // fixed typo
    next();
});

// Then attach the router separately
app.use('/api/post', postRoutes);

app.use(handleErrors);


app.listen(PORT,() => {
    logger.info(`Post service is running at port ${PORT}`);
})

process.on("unhandledRejection" , (reason,promise) => {
    logger.error(`unhanlded rejection at promise : ${promise} due to ${reason}`);
})



