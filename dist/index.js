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
require('colors');
const dotenv_1 = __importDefault(require("dotenv")); // Use dotenv for environment variables
const index_1 = __importDefault(require("./routes/index"));
const notFound_1 = __importDefault(require("./middlewares/notFound"));
const networkAvailability_1 = __importDefault(require("./middlewares/networkAvailability"));
const databaseUnavailable_1 = __importDefault(require("./middlewares/databaseUnavailable"));
const constants_1 = require("./helpers/constants");
const mongodb_1 = __importDefault(require("./config/mongodb"));
const chat_1 = __importDefault(require("./controllers/chat"));
const authValidation_1 = require("./validations/authValidation");
const registerwebhook_1 = __importDefault(require("./controllers/registerwebhook"));
const prisma_1 = require("./helpers/prisma");
const redisFunc_1 = __importDefault(require("./helpers/redisFunc"));
const auth_1 = __importDefault(require("./helpers/auth"));
const jwt = require('jsonwebtoken');
const { checkUserAvailability } = auth_1.default;
const { redisCallStore } = redisFunc_1.default;
const { registerWebhook } = registerwebhook_1.default;
const { validateChat, verifyUserAuth, createChat, accountDeduction, accountAddition, changeUserAvailability } = chat_1.default;
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
    io.on("connection", (socket) => {
        // for typing
        socket.on('typing', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const validation = yield (0, authValidation_1.chatValidation)(data);
                if ((validation === null || validation === void 0 ? void 0 : validation.statusCode) == 422) {
                    console.log(validation);
                    callback({ status: false, statusCode: 422, message: validation.message, error: validation.message });
                    return;
                }
                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
                const userAuth = yield verifyUserAuth(data.token);
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
                }
                else if (userAuth.statusCode === 500) {
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
            }
            catch (er) {
                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
                socket.broadcast.emit(`${user_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                });
            }
        }));
        // for chat
        socket.on('send-chat-text', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const validation = yield (0, authValidation_1.chatValidation)(data);
                if ((validation === null || validation === void 0 ? void 0 : validation.statusCode) == 422) {
                    console.log(validation);
                    callback({ status: false, statusCode: 422, message: validation.message, error: validation.message });
                    return;
                }
                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
                const userAuth = yield verifyUserAuth(data.token);
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
                }
                else if (userAuth.statusCode === 500) {
                    socket.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                const deduction = yield accountDeduction(userAuth.data, data);
                if ((deduction === null || deduction === void 0 ? void 0 : deduction.statusCode) === 404 || (deduction === null || deduction === void 0 ? void 0 : deduction.statusCode) === 401 || (deduction === null || deduction === void 0 ? void 0 : deduction.statusCode) === 500) {
                    socket.emit(`${user_id}`, {
                        statusCode: deduction.statusCode,
                        message: deduction.message,
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                const addition = yield accountAddition(userAuth.data, data);
                if (addition.statusCode === 500) {
                    //callback(addition);
                    socket.emit(`${user_id}`, {
                        statusCode: 500,
                        message: "Error with accounting",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                const saved_chat = yield createChat(data, userAuth.data);
                if (saved_chat.statusCode === 500) {
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
            }
            catch (error) {
                console.log(error);
                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
                socket.broadcast.emit(`${user_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                    idempotency_key: data.idempotency_key
                });
            }
        }));
        // FOR VIDEO CALL
        // Listening for call
        socket.on('place-call', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            const validation = yield (0, authValidation_1.videoValidation)(data);
            if ((validation === null || validation === void 0 ? void 0 : validation.statusCode) == 422) {
                console.log(validation);
                callback({ status: false, statusCode: 422, message: validation.message, error: validation.message });
                return;
            }
            const { meeting_id, caller_id, receiver_id, appointment_id } = data;
            // this will get the user data of the event emitter
            const userAuth = yield verifyUserAuth(data.token);
            if (userAuth.statusCode === 401) {
                socket.emit(`${caller_id}`, {
                    statusCode: 401,
                    message: userAuth.message,
                    idempotency_key: data.idempotency_key,
                });
                return;
            }
            else if (userAuth.statusCode === 404) {
                socket.emit(`${caller_id}`, {
                    statusCode: 401,
                    message: "Auth session id expired. Please login and get new x-id-key.",
                    idempotency_key: data.idempotency_key
                });
                return;
            }
            else if (userAuth.statusCode === 500) {
                socket.emit(`${caller_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error",
                    idempotency_key: data.idempotency_key
                });
                return;
            }
            // check the availability of the receiver
            const availability = yield checkUserAvailability(receiver_id);
            if ((availability === null || availability === void 0 ? void 0 : availability.statusCode) === 409) {
                callback({ statusCode: 409, message: 'User is unavailable at the moment try again later' });
                return;
            }
            callback({ statusCode: 200, message: `You've placed a call`, meeting_id, caller_id, receiver_id, availability });
            // remember to trigger push notification to the reciever
            socket.broadcast.emit(`call-${receiver_id}`, {
                statusCode: 200,
                message: `You're receiving a call from ${userAuth.data.first_name} ${userAuth.data.last_name} `,
                meeting_id, caller_id, receiver_id,
                userData: userAuth.data,
                availability
            });
        }));
        // Listening for the call-not-answered event
        socket.on('call-not-answered', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const validation = yield (0, authValidation_1.videoValidation)(data);
                if ((validation === null || validation === void 0 ? void 0 : validation.statusCode) == 422) {
                    console.log(validation);
                    callback({ status: false, statusCode: 422, message: validation.message, error: validation.message });
                    return;
                }
                const { meeting_id, caller_id, receiver_id, } = data;
                const userAuth = yield verifyUserAuth(data.token);
                if (userAuth.statusCode === 401) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: userAuth.message,
                        idempotency_key: data.idempotency_key,
                    });
                    return;
                }
                else if (userAuth.statusCode === 404) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: "Auth session id expired. Please login and get new x-id-key.",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                else if (userAuth.statusCode === 500) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                // send a notification ( you missed a call )
                socket.emit(`${receiver_id}`, { statusCode: 200, message: `Call wasn't answered`, meeting_id, caller_id, receiver_id });
                // Emit the response back to the caller
                socket.broadcast.emit(`call-not-answered-${data.caller_id}`, {
                    statusCode: 200,
                    message: `${userAuth.data.last_name} ${userAuth.data.first_name} isn't available at the moment, please try again later.`,
                    meeting_id, caller_id, receiver_id,
                    userData: userAuth.data
                });
            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                    meeting_id: data.meeting_id
                });
            }
        }));
        // Listening for the answered call event
        socket.on('call-answered', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const validation = yield (0, authValidation_1.videoValidation)(data);
                if ((validation === null || validation === void 0 ? void 0 : validation.statusCode) == 422) {
                    console.log(validation);
                    callback({ status: false, statusCode: 422, message: validation.message, error: validation.message });
                    return;
                }
                const { meeting_id, caller_id, receiver_id } = data;
                yield changeUserAvailability(caller_id);
                yield changeUserAvailability(receiver_id);
                const userAuth = yield verifyUserAuth(data.token);
                if (userAuth.statusCode === 401) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: userAuth.message,
                        idempotency_key: data.idempotency_key,
                    });
                    return;
                }
                else if (userAuth.statusCode === 404) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 401,
                        message: "Auth session id expired. Please login and get new x-id-key.",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                else if (userAuth.statusCode === 500) {
                    socket.emit(`${caller_id}`, {
                        statusCode: 500,
                        message: "Internal Server Error",
                        idempotency_key: data.idempotency_key
                    });
                    return;
                }
                socket.emit(`${receiver_id}`, { statusCode: 200, message: `You've answred your call `, meeting_id, caller_id, receiver_id });
                // Emit the response back to the caller
                socket.broadcast.emit(`call-answered-${data.caller_id}`, {
                    statusCode: 200,
                    message: `${userAuth.data.last_name} ${userAuth.data.first_name} has accepted your call, you can now begin conferencing`,
                    meeting_id, caller_id, receiver_id,
                    userData: userAuth.data
                });
                // now make the availability of the caller and receiver false
            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                    meeting_id: data.meeting_id
                });
            }
        }));
        // Listening for the call rejection event
        socket.on('call-rejected', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const validation = yield (0, authValidation_1.videoValidation)(data);
                if ((validation === null || validation === void 0 ? void 0 : validation.statusCode) == 422) {
                    console.log(validation);
                    callback({ status: false, statusCode: 422, message: validation.message, error: validation.message });
                    return;
                }
                const { meeting_id, caller_id, receiver_id, } = data;
                callback({ statusCode: 200, message: `You've rejected an incomming call. `, meeting_id, caller_id, receiver_id });
                // Emit the response back to the caller
                socket.broadcast.emit(`call-rejected-${data.caller_id}`, {
                    statusCode: 200,
                    message: `User is busy, Please try again later, thank you.`,
                    meeting_id, caller_id, receiver_id
                });
            }
            catch (error) {
                console.log(error);
                socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                    meeting_id: data.meeting_id
                });
            }
        }));
        // Listening for the call disconnected event
        socket.on('call-disconnected', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const validation = yield (0, authValidation_1.videoValidation)(data);
                if ((validation === null || validation === void 0 ? void 0 : validation.statusCode) == 422) {
                    console.log(validation);
                    callback({ status: false, statusCode: 422, message: validation.message, error: validation.message });
                    return;
                }
                const { meeting_id, caller_id, receiver_id, } = data;
                callback({ statusCode: 200, message: `You're no longer conected. `, meeting_id, caller_id, receiver_id });
                // Emit the response back to the caller
                socket.broadcast.emit(`call-disconnected-${data.caller_id}`, {
                    statusCode: 200,
                    message: `User is disconnected.`,
                    meeting_id, caller_id, receiver_id
                });
            }
            catch (error) {
                console.log(error);
                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
                socket.broadcast.emit(`video-call-${data.receiver_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error in the catch block",
                    meeting_id: data.meeting_id
                });
            }
        }));
    });
}
catch (err) {
    console.log('Caught error while trying to yse socket. ', err);
}
prisma_1.redis_client.on('error', (err) => {
    console.log("Error encountered while connecting to redis.".red.bold, err);
});
prisma_1.redis_client.on('connect', () => {
    console.log(`Redis connection established successfully.`.cyan.bold);
});
// middleware
app.use(networkAvailability_1.default);
app.use(databaseUnavailable_1.default);
registerWebhook();
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
app.use('/api/v1/videosdkwebhook', index_1.default); // so i will have someting lile http://localhost:6000/api/v1/videosdkwebhook/webhook
app.use(notFound_1.default);
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    const PORT = constants_1.port || 4000;
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