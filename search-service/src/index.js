const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const {Redis} = require('ioredis');
const mongoose = require('mongoose');
const path = require('path')
const {connectToRabbitmq,consumeEvent} = require('./utils/rabbitmq')
const {updateSearchAfterPost,updateSearchAfterPostDelete} = require('./eventHandlers/eventHandlers')

const searchRoutes = require('./routes/searchRoutes')


const logger = require('./utils/logger');
const {handleErrors} = require('./middlewares/errorHandler');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.port;

const redisClient = new Redis(process.env.redis_url || 'redis://localhost:6379');

mongoose.connect(process.env.mongo_url)
.then(() => logger.info(`connected to mongo db`))
.catch((e) => logger.error(`unable to connect to mongo db ${e}`))

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req,res,next) => {
    logger.info(`Received ${req.method} request to url : ${req.url}`);
    logger.info(`request body: ${req.body}`);
    next();
})

app.use('/api/search', (req, res, next) => {
    req.redisClient = redisClient;  
    next();
});

app.use('/api/search', searchRoutes);

app.use(handleErrors);



async function startServer () {
    try {
        await connectToRabbitmq();
        
        await consumeEvent("post.created",updateSearchAfterPost);

        await consumeEvent("post.deleted",updateSearchAfterPostDelete);

        app.listen(PORT,() => {
          logger.info(`Search service is running at port ${PORT}`);
        })

        logger.info(`Redis is running at port ${process.env.redis_url}`)
    } catch (error) {
        logger.error(`failed to connect to server`);
        process.exit(1);
    }
}

startServer();

process.on("unhandledRejection" , (reason,promise) => {
    logger.error(`unhanlded rejection at promise : ${promise} due to ${reason}`);
})
