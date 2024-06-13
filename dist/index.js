"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const body_parser_1 = __importDefault(require("body-parser"));
const web_push_1 = __importDefault(require("web-push"));
const cors_1 = __importDefault(require("cors"));
const ioredis_1 = __importDefault(require("ioredis"));
require('colors');
const dotenv_1 = __importDefault(require("dotenv")); // Use dotenv for environment variables
const index_1 = __importDefault(require("./routes/index"));
const notFound_1 = __importDefault(require("./middlewares/notFound"));
const networkAvailability_1 = __importDefault(require("./middlewares/networkAvailability"));
const databaseUnavailable_1 = __importDefault(require("./middlewares/databaseUnavailable"));
const constants_1 = require("./helpers/constants");
const mongodb_1 = __importDefault(require("./config/mongodb"));
const chat_1 = __importDefault(require("./controllers/chat"));
const { validateChat, verifyUserAuth, createChat, accountDeduction, accountAddition } = chat_1.default;
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
app.use(express_1.default.json());
app.use((0, cors_1.default)(constants_1.CORS_OPTION));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
// config webpush.js
if (!constants_1.vapid_public_key || !constants_1.vapid_private_key) {
    throw new Error('Private and Public VAPID keys not found');
}
web_push_1.default.setVapidDetails('mailto:iroegbu.dg@gmail.com', constants_1.vapid_public_key, constants_1.vapid_private_key);
try {
    // io.on("connection", (socket:any) => {
    //     // for chat
    //     // socket.on('send-chat-text', async (data: any, callback: any) => {         
    //     //     try {
    //     //         const validation = await chatValidation(data)
    //     //         if(validation?.statusCode == 422){
    //     //             console.log(validation);
    //     //             callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
    //     //             return;
    //     //         }
    //     //         const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
    //     //         const userAuth = await verifyUserAuth(data.token);
    //     //         if (userAuth.statusCode === 401) {
    //     //             socket.emit(`${user_id}`, {
    //     //                 statusCode: 401,
    //     //                 message: userAuth.message,
    //     //                 idempotency_key: data.idempotency_key,
    //     //             });
    //     //             return;
    //     //         }
    //     //         else if (userAuth.statusCode === 404) {
    //     //             socket.emit(`${user_id}`, {
    //     //                 statusCode: 401,
    //     //                 message: "Auth session id expired. Please login and get new x-id-key.",
    //     //                 idempotency_key: data.idempotency_key
    //     //             });
    //     //             return;
    //     //         }else if (userAuth.statusCode === 500){
    //     //             socket.emit(`${user_id}`, {
    //     //                 statusCode: 500,
    //     //                 message: "Internal Server Error",
    //     //                 idempotency_key: data.idempotency_key
    //     //             });
    //     //             return;
    //     //         }
    //     //         const deduction = await accountDeduction(userAuth.data, data)
    //     //         if (deduction?.statusCode === 404 || deduction?.statusCode === 401 || deduction?.statusCode === 500){
    //     //             socket.emit(`${user_id}`, {
    //     //                 statusCode: deduction.statusCode,
    //     //                 message: deduction.message,
    //     //                 idempotency_key: data.idempotency_key
    //     //             });
    //     //             return;
    //     //         }
    //     //         const addition:any = await accountAddition(userAuth.data, data)
    //     //         if (addition.statusCode === 500){
    //     //             //callback(addition);
    //     //             socket.emit(`${user_id}`, {
    //     //                 statusCode: 500,
    //     //                 message: "Error with accounting",
    //     //                 idempotency_key: data.idempotency_key
    //     //             });
    //     //             return;
    //     //         }
    //     //         const saved_chat:any = await createChat(data, userAuth.data);
    //     //         if (saved_chat.statusCode === 500 ){
    //     //             socket.emit(`${user_id}`, {
    //     //                 statusCode: 500,
    //     //                 message: "Error sending messages",
    //     //                 idempotency_key: data.idempotency_key
    //     //             });
    //     //             return;
    //     //         }
    //     //         // sender receives a callback
    //     //         socket.emit(`${user_id}`, {
    //     //             statusCode: 200,
    //     //             message: "Message sent succesfully, ",
    //     //             idempotency_key: data.idempotency_key,
    //     //             chat: saved_chat,
    //     //         });
    //     //         // Get the receiver ID
    //     //         const receiver_id = data.is_physician ? data.patient_id : (data.is_patient ? data.physician_id : null);
    //     //         // Broadcast to the receiver only
    //     //         socket.broadcast.emit(`${receiver_id}`, {
    //     //             statusCode: 200,
    //     //             chat: saved_chat,
    //     //             senderData: userAuth.data,
    //     //             idempotency_key: data.idempotency_key,
    //     //             note: 'received'
    //     //         });
    //     //         // Broadcast to patient-physician (sender and receinver)
    //     //         socket.broadcast.emit(`${data.patient_id}-${data.physician_id}`, {
    //     //             statusCode: 200,
    //     //             chat: saved_chat,
    //     //             idempotency_key: data.idempotency_key
    //     //         });
    //     //     } catch (error) {    
    //     //         console.log(error)
    //     //         const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
    //     //         socket.broadcast.emit(`${user_id}`, {
    //     //             statusCode: 500,
    //     //             message: "Internal Server Error in the catch block",
    //     //             idempotency_key: data.idempotency_key
    //     //         });
    //     //     }
    //     // });
    //     // FOR VIDEO CALL
    //     // WHEN CALL IS NOT ANSWERED
    //     socket.on('call-not-answered', async (data: any, callback: any) => {
    //         console.log('received ::  ', data);
    //         callback({
    //             statusCode: 200,
    //             message: "The user you are trying to call is not available at the moment, please try again later thank you."
    //         });
    //         socket.emit('call-not-answered-response', {
    //             statusCode: 200,
    //             message: "The user you are trying to call is not available at the moment, please try again later thank you."
    //         });
    //         socket.broadcast.emit('call-not-answered-response', {
    //             statusCode: 200,
    //             message: "The user you are trying to call is not available at the moment, please try again later thank you."
    //         });
    //     });
    //     // socket.on(`callAccepted`, async(data:any, callback:any)=>{
    //     //     const {meetingId, patient_id, is_patient, physician_id, is_physician } = data
    //     //     const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
    //     //     const validation = await videoChatValidation(data)
    //     //     if(validation?.statusCode == 422){
    //     //         console.log(validation);
    //     //         callback({status: false,statusCode: 422,message: validation.message,error: validation.message});
    //     //         return;
    //     //     }
    //     //     const userAuth = await verifyUserAuth(data.auth_token);
    //     //     if (userAuth.statusCode === 401) {
    //     //         socket.emit(`${user_id}`, {
    //     //             statusCode: 401,
    //     //             message: userAuth.message,
    //     //         });
    //     //         return;
    //     //     }
    //     //     const caller = data.is_physician ? data.patient_id : (data.is_patient ? data.physician_id : null);
    //     //     // to the receiver olone
    //     //     socket.broadcast.emit(`accepted-call-${caller}`, {
    //     //         statusCode: 200,
    //     //         message: "your call has been accepted accepted your call"
    //     //     })
    //     //     // when a user leaves or cancels the call
    //     //     socket.on(`leftCall`, (data: any,callback:any)=>{
    //     //         // emit the response to the second user
    //     //         const receiver = data.is_physician ? data.patient_id : (data.is_patient ? data.physician_id : null);
    //     //         const user = data.is_physician ? "Doctor" : (data.is_patient ? "Patient" : "User")
    //     //         socket.emit(`leftCall-${receiver}`, {
    //     //             statusCode: 200,
    //     //             message: `${user} left the call`
    //     //         })
    //     //     })
    //     // })
    // });
    io.on('connection', (socket) => {
        console.log('a user connected');
        // Listening for the call-not-answered event
        socket.on('call-not-answered', (data, callback) => {
            console.log('call-not-answered event received:', data);
            // Process the data as needed, then emit a response event
            const response = {
                statusCode: 200,
                title: 'normal response',
                message: 'Call not answered event processed successfully'
            };
            const callbackResponse = {
                statusCode: 200,
                title: 'callback response',
                message: 'Call not answered event processed successfully'
            };
            // Emit the response back to the client
            socket.broadcast.emit('call-not-answered-response', response);
            // Call the callback function with the response if necessary
            if (callback)
                callback(callbackResponse);
        });
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
}
catch (err) {
    console.log('Caught error while trying to yse socket. ', err);
}
if (!constants_1.redis_url) {
    throw new Error("Redis url not found");
}
const redis_client = new ioredis_1.default(constants_1.redis_url); // Initialize Redis client
redis_client.on('error', (err) => {
    console.log("Error encountered while connecting to redis.".red.bold, err);
});
redis_client.on('connect', () => {
    console.log(`Redis connection established successfully`.cyan.bold);
});
// middleware
app.use(networkAvailability_1.default);
app.use(databaseUnavailable_1.default);
// routes
app.use('/api/v1/auth', index_1.default);
app.use('/api/v1/user', index_1.default);
app.use('/api/v1/chat', index_1.default);
app.use('/api/v1/message', index_1.default);
app.use('/api/v1/facility', index_1.default);
app.use('/api/v1/appointment', index_1.default);
app.use('/api/v1/transaction', index_1.default);
app.use('/api/v1/case-note', index_1.default);
app.use('/api/v1/push-notification', index_1.default);
app.use('/api/v1/notification', index_1.default);
app.use(notFound_1.default);
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    const PORT = constants_1.port || 6000;
    try {
        yield (0, mongodb_1.default)();
        server.listen(PORT, () => console.log(`OHealth server started and running on port ${PORT}`.cyan.bold));
    }
    catch (err) {
        console.log(`something went wrong`.red.bold);
    }
});
start();
//# sourceMappingURL=index.js.map