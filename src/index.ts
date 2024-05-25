import express from 'express';
import http from 'http';
import webpush from 'web-push'
const FCM = require('fcm-node')
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import Redis from 'ioredis';
import colors from 'colors';
require('colors')
import dotenv from 'dotenv'; // Use dotenv for environment variables
import index from './routes/index';
import notFound from './middlewares/notFound';
import networkAvailability from './middlewares/networkAvailability';
import handleDatabaseError from './middlewares/databaseUnavailable';
import { CORS_OPTION, port, private_vipid_key, public_vipid_key, redis_url } from './helpers/constants';
import connectToMongoDB from './config/mongodb';
import chat from './controllers/chat';
import authValidation, { chatValidation } from './validations/authValidation';

const {validateChat, verifyUserAuth, createChat, accountDeduction, accountAddition} = chat

dotenv.config();

const app = express();

const server = http.createServer(app);

const io:any = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors(CORS_OPTION));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// handling web push

// if (!public_vipid_key || !private_vipid_key){
//     throw new Error ('Private and Public Vipid keys not found')
// }

// webpush.setVapidDetails('mailto:ireugbudavid@gmail.com', public_vipid_key, private_vipid_key);

// app.post('/subscribe', (req, res) => {
//     const {subscription, url} = req.body;

//     console.log('subscription : ',subscription)

//     res.status(201).json({});

//     const payloadData = {
//         title: 'Push Notification Title',
//         body: 'Notification body entered by David',
//         icon: 'https://images.pexels.com/photos/5083013/pexels-photo-5083013.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
//         url: url
//     };

//     const payload = JSON.stringify(payloadData);

//     webpush.sendNotification(subscription, payload)
//     .then(()=> console.log('Push notification sent successfully'.blue.bold))
//     .catch(err => console.error(err));
// });


const serverKey = 'BAoq8SpI6kX6dxoWvYtLAkrzOirNOK6vaWI93D-4y0A8zbRe6LEWgb208TnmEa-vK1N6gSKpiFP9JODKIY4ueD8';
const fcm = new FCM(serverKey);

app.post('/send-notification', (req, res) => {
    const deviceToken = req.body.deviceToken;
    const message = {
        to: deviceToken,
        notification: {
        title: 'Notification Test App',
        body: 'Message from Node.js app',
        },
        data: {
        title: 'OK',
        body: '{"name": "OK Google", "product_id": "123", "final_price": "0.00035"}',
        },
    };

    fcm.send(message, (err:any, response:any) => {
        if (err) {
        console.error('Error sending notification:', err);
        res.status(500).send({ message: 'Error sending notification' });
        } else {
        console.log('Notification sent successfully:', response);
        res.send({ message: 'Notification sent successfully' });
        }
    });
});


try {
    io.on("connection", (socket:any) => {
        socket.on('send-chat-text', async (data: any, callback: any) => {         
            try {
                
                const validation = await chatValidation(data)
                if(validation?.statusCode == 422){
                    console.log(validation);
                    callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                    return;
                }

                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);

                
                const userAuth = await verifyUserAuth(data.token);
                if (userAuth.statusCode === 401) {

                    socket.emit(`${user_id}`, {
                        statusCode: 401,
                        message: "You are unauthorized to send this message, kindly login.",
                        idempotency_key: data.idempotency_key,
                    });
                    return;
                }
                else if (userAuth.statusCode === 404) {
                    socket.emit(`${user_id}`, {
                        statusCode: 401,
                        message: "Auth session id expired. Please login and get new x-id-key.",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }else if (userAuth.statusCode === 500){
                    socket.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                
                const deduction = await accountDeduction(userAuth.data, data)
                if (deduction?.statusCode === 404 || deduction?.statusCode === 401 || deduction?.statusCode === 500){

                    socket.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Error Deducting your account",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                
                const addition:any = await accountAddition(userAuth.data, data)
                if (addition.statusCode === 500){
                    //callback(addition);
                    socket.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Error with accounting",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                
                const saved_chat:any = await createChat(data, userAuth.data);
                if (saved_chat.statusCode === 500 ){
                    socket.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Error sending messages",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }


                console.log("saved_chat", saved_chat)
    
            
                socket.emit(`${user_id}`, {
                    statusCode: 200,
                    message: "Message sent succesfully",
                    idempotency_key: data.idempotency_key,
                    chat: saved_chat
                });
    
                socket.broadcast.emit(`${data.patient_id}-${data.physician_id}`, saved_chat);
        
        
            } catch (error) {    
                console.log(error)
            

                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);

                socket.broadcast.emit(`${user_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error",
                    idempotency_key: data.idempotency_key
                });
            
            }
        });
        
    });
} catch (err:any) {
    console.log('Caught error while trying to yse socket ', err)
}


if (!redis_url) {
    throw new Error("Redis url not found");
    
}

const redis_client = new Redis(redis_url); // Initialize Redis client

redis_client.on('error', (err) => {
    console.log("Error encountered while connecting to redis.".red.bold, err);
});
redis_client.on('connect', () => {
    console.log(`Redis connection established successfully.`.cyan.bold);
});


// middleware
app.use(networkAvailability);
app.use(handleDatabaseError);

// routes
app.use('/api/v1/auth', index);
app.use('/api/v1/user', index);
app.use('/api/v1/chat', index);
app.use('/api/v1/message', index);
app.use('/api/v1/facility', index);
app.use('/api/v1/appointment', index);
app.use('/api/v1/transaction', index);

app.use(notFound);

const start = async () => {
    const PORT = port || 6000;
    try {
        await connectToMongoDB();
        server.listen(PORT, () => console.log(`OHealth server started and running on port ${PORT}`.cyan.bold));
    } catch (err) {
        console.log(`something went wrong`.red.bold);
    }
}

start();


