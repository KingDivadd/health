import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import webpush from 'web-push'
import apn from 'apn'
import cors from 'cors';
import colors from 'colors';
require('colors')
import dotenv from 'dotenv'; // Use dotenv for environment variables
import index from './routes/index';
import notFound from './middlewares/notFound';
import networkAvailability from './middlewares/networkAvailability';
import handleDatabaseError from './middlewares/databaseUnavailable';
import { CORS_OPTION, jwt_secret, port, redis_url, vapid_private_key, vapid_public_key } from './helpers/constants';
import connectToMongoDB from './config/mongodb';
import chat from './controllers/chat';
import authValidation, { chatValidation, videoChatValidation, videoValidation } from './validations/authValidation';
import registerwebhook from './controllers/registerwebhook';
import {redis_client} from './helpers/prisma'
import redisFunc from './helpers/redisFunc';
import auth from './helpers/auth'
const jwt = require('jsonwebtoken')


const {checkUserAvailability} = auth

const {redisCallStore} = redisFunc

const {registerWebhook} = registerwebhook

const {validateChat, verifyUserAuth, createChat, accountDeduction, accountAddition, changeUserAvailability} = chat

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

// config webpush.js

if (!vapid_public_key || !vapid_private_key) {
    throw new Error('Private and Public VAPID keys not found');
}

webpush.setVapidDetails(
    'mailto:iroegbu.dg@gmail.com', vapid_public_key, vapid_private_key);



    try {
        io.on("connection", (socket:any) => {
            // for typing
            socket.on('typing', async(data: any, callback:any) =>{
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
                            message: userAuth.message,
                            idempotency_key: data.idempotency_key,
                        });
                        return;
                    }else if (userAuth.statusCode === 404) {
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

                    // sender receives a callback when in the chat page
                    socket.broadcast.emit(`${data.patient_id}-${data.physician_id}`, {
                        statusCode: 200,
                        message: "Typing... ",
                        userData: userAuth.data
                    });

    
                } catch (er:any) {
                    const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
                    socket.broadcast.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error in the catch block",
                    });
                }
            })
            // for chat
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
                            message: userAuth.message,
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
                            statusCode: deduction.statusCode,
                            message: deduction.message,
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
    
                    // sender receives a callback
                    socket.emit(`${user_id}`, {
                        statusCode: 200,
                        message: "Message sent succesfully. ",
                        idempotency_key: data.idempotency_key,
                        chat: saved_chat,
                    });
        
                    // Get the receiver ID
                    const receiver_id = data.is_physician ? data.patient_id : (data.is_patient ? data.physician_id : null);
    
                    // Broadcast to the receiver only
                    socket.broadcast.emit(`${receiver_id}`, {
                        statusCode: 200,
                        chat: saved_chat,
                        senderData: userAuth.data,
                        idempotency_key: data.idempotency_key,
                        note: 'received'
                    });
    
                    // Broadcast to patient-physician (sender and receinver)
                    socket.broadcast.emit(`${data.patient_id}-${data.physician_id}`, {
                        statusCode: 200,
                        chat: saved_chat,
                        idempotency_key: data.idempotency_key
                    });
    
                    
                } catch (error) {    
                    console.log(error)
                
                    const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
    
                    socket.broadcast.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error in the catch block",
                        idempotency_key: data.idempotency_key
                    });
                
                }
            });
    
            // FOR VIDEO CALL
            // Listening for call
            socket.on('place-call', async(data:any, callback:any)=>{
                const validation = await videoValidation(data)
                    if(validation?.statusCode == 422){
                        console.log(validation);
                        callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                        return;
                    }

                const {meeting_id, caller_id, receiver_id, appointment_id } = data

                // this will get the user data of the event emitter
                const userAuth = await verifyUserAuth(data.token);
                if (userAuth.statusCode === 401) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: userAuth.message,
                        idempotency_key: data.idempotency_key,
                    });
                    return;
                }else if (userAuth.statusCode === 404) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: "Auth session id expired. Please login and get new x-id-key.",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }else if (userAuth.statusCode === 500){
                    socket.emit(`${caller_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }

                // check the availability of the receiver
                const availability = await checkUserAvailability(receiver_id)
                if (availability?.statusCode === 409){
                    callback({statusCode: 409, message: 'User is unavailable at the moment try again later'})
                    return;
                }


                callback({statusCode: 200, message: `You've placed a call`, meeting_id, caller_id, receiver_id, availability})

                // remember to trigger push notification to the reciever
                socket.broadcast.emit(`call-${receiver_id}`, {
                    statusCode: 200,
                    message: `You're receiving a call from ${userAuth.data.first_name} ${userAuth.data.last_name} `,
                    meeting_id, caller_id, receiver_id,
                    userData: userAuth.data,
                    availability
                })
            })
    
            // Listening for the call-not-answered event
            socket.on('call-not-answered', async(data:any, callback:any) => {
                try {
                    const validation = await videoValidation(data)
                    if(validation?.statusCode == 422){
                        console.log(validation);
                        callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                        return;
                    }
                    const {meeting_id, caller_id, receiver_id, } = data

                    const userAuth = await verifyUserAuth(data.token);
                    if (userAuth.statusCode === 401) {
                        socket.emit(`${caller_id}`, {
                            statusCode: 401,
                            message: userAuth.message,
                            idempotency_key: data.idempotency_key,
                        });
                        return;
                    }else if (userAuth.statusCode === 404) {
                        socket.emit(`${caller_id}`, {
                            statusCode: 401,
                            message: "Auth session id expired. Please login and get new x-id-key.",
                            idempotency_key: data.idempotency_key
                        });
                        return;
                    }else if (userAuth.statusCode === 500){
                        socket.emit(`${caller_id}`, {
                            statusCode: 500,
                            message: "Internal Server Error",
                            idempotency_key: data.idempotency_key
                        });
                        return;
                    }
    
                    // send a notification ( you missed a call )
                    callback({statusCode: 200, message: `Call wasn't answered`, meeting_id, caller_id, receiver_id})            
            
                    // Emit the response back to the caller
                    socket.broadcast.emit(`call-not-answered-${data.caller_id}`, {
                        statusCode: 200,
                        message: `${userAuth.data.last_name} ${userAuth.data.first_name} isn't available at the moment, please try again later.`,
                        meeting_id, caller_id, receiver_id,
                        userData: userAuth.data
                    } );
            
                    } catch (error: any) {
                        console.log(error)
                
                        socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                            statusCode: 500,
                            message: "Internal Server Error in the catch block",
                            meeting_id: data.meeting_id
                        });
                    }
            });
        
            // Listening for the answered call event
            socket.on('call-answered', async(data:any, callback:any) => {
                try {
                    const validation = await videoValidation(data)
                    if(validation?.statusCode == 422){
                        console.log(validation);
                        callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                        return;
                    }
                    const {meeting_id, caller_id, receiver_id} = data

                    await changeUserAvailability(caller_id)
                    await changeUserAvailability(receiver_id)

                    const userAuth = await verifyUserAuth(data.token);
                    if (userAuth.statusCode === 401) {
                        socket.emit(`${caller_id}`, {
                            statusCode: 401,
                            message: userAuth.message,
                            idempotency_key: data.idempotency_key,
                        });
                        return;
                    }else if (userAuth.statusCode === 404) {
                        socket.emit(`${caller_id}`, {
                            statusCode: 401,
                            message: "Auth session id expired. Please login and get new x-id-key.",
                            idempotency_key: data.idempotency_key
                        });
                        return;
                    }else if (userAuth.statusCode === 500){
                        socket.emit(`${caller_id}`, {
                            statusCode: 500,
                            message: "Internal Server Error",
                            idempotency_key: data.idempotency_key
                        });
                        return;
                    }
    
                    callback({statusCode: 200, message: `You've answred your call `, meeting_id, caller_id, receiver_id})            
            
                    // Emit the response back to the caller
                    socket.broadcast.emit(`call-answered-${data.caller_id}`, {
                        statusCode: 200,
                        message: `${userAuth.data.last_name} ${userAuth.data.first_name} has accepted your call, you can now begin conferencing`,
                        meeting_id, caller_id, receiver_id,
                        userData: userAuth.data
                    } );

                    // now make the availability of the caller and receiver false
                    
            
                    } catch (error: any) {
                        console.log(error)
                    
                        socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                            statusCode: 500,
                            message: "Internal Server Error in the catch block",
                            meeting_id: data.meeting_id
                        });
                    }
            });
    
            // Listening for the call rejection event
            socket.on('call-rejected', async(data:any, callback:any) => {
                try {
                    const validation = await videoValidation(data)
                    if(validation?.statusCode == 422){
                        console.log(validation);
                        callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                        return;
                    }
                    const {meeting_id, caller_id, receiver_id, } = data
    
                    callback({statusCode: 200, message: `You've rejected an incomming call. `, meeting_id, caller_id, receiver_id})            
            
                    // Emit the response back to the caller
                    socket.broadcast.emit(`call-rejected-${data.caller_id}`, {
                        statusCode: 200,
                        message: `User is busy, Please try again later, thank you.`,
                        meeting_id, caller_id, receiver_id
                    } );
            
                    } catch (error: any) {
                        console.log(error)
                    
    
                        socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                            statusCode: 500,
                            message: "Internal Server Error in the catch block",
                            meeting_id: data.meeting_id
                        });
                    }
            });
        
            // Listening for the call disconnected event
            socket.on('call-disconnected', async(data:any, callback:any) => {
                try {
                    const validation = await videoValidation(data)
                    if(validation?.statusCode == 422){
                        console.log(validation);
                        callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                        return;
                    }
                    const {meeting_id, caller_id, receiver_id, } = data
    
                    callback({statusCode: 200, message: `You're no longer conected. `, meeting_id, caller_id, receiver_id})            
            
                    // Emit the response back to the caller
                    socket.broadcast.emit(`call-disconnected-${data.caller_id}`, {
                        statusCode: 200,
                        message: `User is disconnected.`,
                        meeting_id, caller_id, receiver_id
                    } );
            
                    } catch (error: any) {
                        console.log(error)
                    
                        const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
    
                        socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                            statusCode: 500,
                            message: "Internal Server Error in the catch block",
                            meeting_id: data.meeting_id
                        });
                    }
            });
        
        
        });
    
        
    } catch (err:any) {
        console.log('Caught error while trying to yse socket. ', err)
    }
    
    
export {io}



redis_client.on('error', (err) => {
    console.log("Error encountered while connecting to redis.".red.bold, err);
});
redis_client.on('connect', () => {
    console.log(`Redis connection established successfully.`.cyan.bold);
});


// middleware
app.use(networkAvailability);
app.use(handleDatabaseError);
registerWebhook()

// routes
app.use('/api/v1/auth', index);
app.use('/api/v1/user', index);
app.use('/api/v1/chat', index);
app.use('/api/v1/message', index);
app.use('/api/v1/facility', index);
app.use('/api/v1/appointment', index);
app.use('/api/v1/transaction', index);
app.use('/api/v1/case-note', index);
app.use('/api/v1/push-notification', index)
app.use('/api/v1/notification', index)
app.use('/api/v1/videosdkwebhook', index)   // so i will have someting lile http://localhost:6000/api/v1/videosdkwebhook/webhook

app.use(notFound);

const start = async () => {
    const PORT = port || 4000;
    try {
        await connectToMongoDB();
        server.listen(PORT, () => console.log(`OHealth server started and running on port ${PORT}`.cyan.bold));
    } catch (err) {
        console.log(`something went wrong`.red.bold);
    }
}

start();