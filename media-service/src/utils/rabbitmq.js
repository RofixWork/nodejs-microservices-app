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

const consumeEvent = async (routingkey, callback) => {
    if(!channel) {
        await connectToRabbitMQ();
    }
    const q = await channel.assertQueue("", {exclusive: true})
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingkey);
    channel.consume(q.queue, (msg) => {
        if(msg !== null) {
            const content = JSON.parse(msg.content.toString());
            callback(content);
            logger.info(`[x] Received ${routingkey}: ${msg}`);
            channel.ack(msg);
        }

    })
}
export {connectToRabbitMQ, publishEvent, consumeEvent}