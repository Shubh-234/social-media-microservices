const express= require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const mediaRouter = require('./routes/mediaRoutes');
const path = require('path');
const {handleErrors} = require('./middlewares/errorHandler')
const {connectToRabbitmq} = require('./utils/rabbitMQ');
const {consumeEvent} = require('./utils/rabbitMQ');
const {handlePostDeleted} = require('./eventHandler/event_handler')

dotenv.config({path : path.resolve(__dirname,'./env')})

const PORT = process.env.PORT || 3003
const app = express();


mongoose.connect(process.env.mongo_url).
then(() => logger.info(`conntected to mongo db`)).
catch(() => logger.error(`unable to connect to mongo db`));


app.use(helmet());
app.use(cors());
app.use(express.json());


app.use((req,res,next) => {
    logger.info(`Received ${req.method} request to url : ${req.url}`);
    logger.info(`request body: ${req.body}`);
    next();
})

//implement ip based rate limiting



//routes

app.use('/api/media', mediaRouter);

app.use(handleErrors);


async function startServer () {
    try {
        await connectToRabbitmq();

        await consumeEvent("post.deleted",handlePostDeleted);

        app.listen(PORT,() => {
          logger.info(`Media service is running at port ${PORT}`);
        })
    } catch (error) {
        logger.error(`failed to connect to server`);
        process.exit(1);
    }
}

startServer()

process.on("unhandledRejection" , (reason,promise) => {
    logger.error(`unhanlded rejection at promise : ${promise} due to ${reason}`);
})







