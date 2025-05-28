const amqp = require('amqplib');
const logger = require('./logger');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
    path : path.resolve(__dirname,'./.env')
})

let connection = null;
let channel = null;
let exchangeName = 'FACEBOOK_EVENTS'

const connectToRabbitmq = async () => {
    try {
        connection = await amqp.connect(process.env.rabbitmq_url);
        channel = await connection.createChannel();

        await channel.assertExchange(exchangeName,"topic",{durable: false});
        //durable false means the exchange wont survive if the broker restarts
        logger.info("Connected to rabbitmq");
    } catch (error) {
        logger.error(`Error connecting to rabbitmq ${error}`);
    }
}

const publishEvent = async (routingKey,message) => {
    if(!channel){
        await connectToRabbitmq();
    }

    channel.publish(exchangeName,routingKey,Buffer.from(JSON.stringify(message)));


    logger.info(`event published: ${routingKey}`);
}


module.exports = {connectToRabbitmq, publishEvent}