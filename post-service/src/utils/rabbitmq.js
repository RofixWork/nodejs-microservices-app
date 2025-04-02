import amqplib from 'amqplib';
import logger from './logger.js';
/**
 * @type {amqplib.ChannelModel}
 */
let connection = null,
/**
 * @type {amqplib.Channel}
 */
channel = null;
const EXCHANGE_NAME = 'facebook_events';
const connectToRabbitMQ = async () => {
    try {
        connection = await amqplib.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, "topic", {
            durable: false
        })
        logger.info(`Connected to RabbitMQ at ${process.env.RABBITMQ_URL}`);
    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error);
    }
}

const publishEvent = async (routingkey, message) => {
    if(!channel) {
        await connectToRabbitMQ();
    }
    channel.publish(EXCHANGE_NAME, routingkey, Buffer.from(JSON.stringify(message)));
    logger.info(`[x] Sent to ${routingkey}: ${message}`);
}
export {connectToRabbitMQ, publishEvent}