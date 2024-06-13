import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import webpush from 'web-push'
import apn from 'apn'
import cors from 'cors';
import Redis from 'ioredis';
import colors from 'colors';
require('colors')
import dotenv from 'dotenv'; // Use dotenv for environment variables
import index from './routes/index';
import notFound from './middlewares/notFound';
import networkAvailability from './middlewares/networkAvailability';
import handleDatabaseError from './middlewares/databaseUnavailable';
import { CORS_OPTION, port, redis_url, vapid_private_key, vapid_public_key } from './helpers/constants';
import connectToMongoDB from './config/mongodb';
import chat from './controllers/chat';
import authValidation, { chatValidation, videoCallNotAnsweredValidation, videoChatValidation } from './validations/authValidation';

const {validateChat, verifyUserAuth, createChat, accountDeduction, accountAddition} = chat

dotenv.config();

const app = express();

const server = http.createServer(app);

const io:any = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
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
        // for chat
        // socket.on('send-chat-text', async (data: any, callback: any) => {         
        //     try {
                
        //         const validation = await chatValidation(data)
        //         if(validation?.statusCode == 422){
        //             console.log(validation);
        //             callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
        //             return;
        //         }

        //         const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);

                
        //         const userAuth = await verifyUserAuth(data.token);
        //         if (userAuth.statusCode === 401) {

        //             socket.emit(`${user_id}`, {
        //                 statusCode: 401,
        //                 message: userAuth.message,
        //                 idempotency_key: data.idempotency_key,
        //             });
        //             return;
        //         }
        //         else if (userAuth.statusCode === 404) {
        //             socket.emit(`${user_id}`, {
        //                 statusCode: 401,
        //                 message: "Auth session id expired. Please login and get new x-id-key.",
        //                 idempotency_key: data.idempotency_key
        //             });
        //             return;
        //         }else if (userAuth.statusCode === 500){
        //             socket.emit(`${user_id}`, {
        //                 statusCode: 500,
        //                 message: "Internal Server Error",
        //                 idempotency_key: data.idempotency_key
        //             });
        //             return;
        //         }
                
        //         const deduction = await accountDeduction(userAuth.data, data)
        //         if (deduction?.statusCode === 404 || deduction?.statusCode === 401 || deduction?.statusCode === 500){

        //             socket.emit(`${user_id}`, {
        //                 statusCode: deduction.statusCode,
        //                 message: deduction.message,
        //                 idempotency_key: data.idempotency_key
        //             });
        //             return;
        //         }
                
        //         const addition:any = await accountAddition(userAuth.data, data)
        //         if (addition.statusCode === 500){
        //             //callback(addition);
        //             socket.emit(`${user_id}`, {
        //                 statusCode: 500,
        //                 message: "Error with accounting",
        //                 idempotency_key: data.idempotency_key
        //             });
        //             return;
        //         }
                
        //         const saved_chat:any = await createChat(data, userAuth.data);
        //         if (saved_chat.statusCode === 500 ){
        //             socket.emit(`${user_id}`, {
        //                 statusCode: 500,
        //                 message: "Error sending messages",
        //                 idempotency_key: data.idempotency_key
        //             });
        //             return;
        //         }

        //         // sender receives a callback
        //         socket.emit(`${user_id}`, {
        //             statusCode: 200,
        //             message: "Message sent succesfully, ",
        //             idempotency_key: data.idempotency_key,
        //             chat: saved_chat,
        //         });
    
        //         // Get the receiver ID
        //         const receiver_id = data.is_physician ? data.patient_id : (data.is_patient ? data.physician_id : null);

        //         // Broadcast to the receiver only
        //         socket.broadcast.emit(`${receiver_id}`, {
        //             statusCode: 200,
        //             chat: saved_chat,
        //             senderData: userAuth.data,
        //             idempotency_key: data.idempotency_key,
        //             note: 'received'
        //         });

        //         // Broadcast to patient-physician (sender and receinver)
        //         socket.broadcast.emit(`${data.patient_id}-${data.physician_id}`, {
        //             statusCode: 200,
        //             chat: saved_chat,
        //             idempotency_key: data.idempotency_key
        //         });

                
        //     } catch (error) {    
        //         console.log(error)
            
        //         const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);

        //         socket.broadcast.emit(`${user_id}`, {
        //             statusCode: 500,
        //             message: "Internal Server Error in the catch block",
        //             idempotency_key: data.idempotency_key
        //         });


            
        //     }
        // });

        // FOR VIDEO CALL

        // WHEN CALL IS NOT ANSWERED
        
        socket.on(`call-not-answered`, async(data: any, callback: any)=>{
            // const validation = await videoCallNotAnsweredValidation(data)
            // if(validation?.statusCode == 422){
            //     console.log(validation);
            //     callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
            //     return;
            // }
            
            console.log('received ::  ', data)

            socket.emit(`call-not-answered-response`, {
                statusCode: 200,
                message: "Message sent succesfully,",
            });

            socket.broadcast.emit(`call-not-answered-response`, {
                statusCode: 200,
                message: "The user you are trying to call is not available at the moment, please try again later thank you."
            })

            socket.emit(`call-not-answered-response`, {
                statusCode: 200,
                message: "The user you are trying to call is not available at the moment, please try again later thank you."
            })
        })

        socket.on(`callAccepted`, async(data:any, callback:any)=>{
            const {meetingId, patient_id, is_patient, physician_id, is_physician } = data
            const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);

            const validation = await videoChatValidation(data)
            if(validation?.statusCode == 422){
                console.log(validation);
                callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
                return;
            }

            const userAuth = await verifyUserAuth(data.auth_token);
            if (userAuth.statusCode === 401) {
                socket.emit(`${user_id}`, {
                    statusCode: 401,
                    message: userAuth.message,
                });
                return;
            }


            const caller = data.is_physician ? data.patient_id : (data.is_patient ? data.physician_id : null);

            // to the receiver olone
            socket.broadcast.emit(`accepted-call-${caller}`, {
                statusCode: 200,
                message: "your call has been accepted accepted your call"
            })

            // when a user leaves or cancels the call
            socket.on(`leftCall`, (data: any,callback:any)=>{

                // emit the response to the second user
                const receiver = data.is_physician ? data.patient_id : (data.is_patient ? data.physician_id : null);
                const user = data.is_physician ? "Doctor" : (data.is_patient ? "Patient" : "User")
                socket.emit(`leftCall-${receiver}`, {
                    statusCode: 200,
                    message: `${user} left the call`
                })
            })
        })
        
    });
} catch (err:any) {
    console.log('Caught error while trying to yse socket. ', err)
}

export {io}


if (!redis_url) {
    throw new Error("Redis url not found");
    
}

const redis_client = new Redis(redis_url); // Initialize Redis client

redis_client.on('error', (err) => {
    console.log("Error encountered while connecting to redis.".red.bold, err);
});
redis_client.on('connect', () => {
    console.log(`Redis connection established successfully`.cyan.bold);
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
app.use('/api/v1/case-note', index);
app.use('/api/v1/push-notification', index)
app.use('/api/v1/notification', index)

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