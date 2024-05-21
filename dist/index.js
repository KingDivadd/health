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
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const web_push_1 = __importDefault(require("web-push"));
const socket_io_1 = require("socket.io");
const body_parser_1 = __importDefault(require("body-parser"));
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
const authValidation_1 = require("./validations/authValidation");
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
app.use(express_1.default.json());
app.use((0, cors_1.default)(constants_1.CORS_OPTION));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
// handling web push
if (!constants_1.public_vipid_key || !constants_1.private_vipid_key) {
    throw new Error('Private and Public Vipid keys not found');
}
web_push_1.default.setVapidDetails('mailto:ireugbudavid@gmail.com', constants_1.public_vipid_key, constants_1.private_vipid_key);
app.post('/subscribe', (req, res) => {
    const { subscription, url } = req.body;
    console.log('subscription : ', subscription);
    res.status(201).json({});
    const payloadData = {
        title: 'Push Notification Title',
        body: 'Notification body entered by David',
        icon: 'https://images.pexels.com/photos/5083013/pexels-photo-5083013.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        url: url
    };
    const payload = JSON.stringify(payloadData);
    web_push_1.default.sendNotification(subscription, payload)
        .then(() => console.log('Push notification sent successfully'.blue.bold))
        .catch(err => console.error(err));
});
try {
    io.on("connection", (socket) => {
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
                        statusCode: 500,
                        message: "Error Deducting your account",
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
                console.log("saved_chat", saved_chat);
                socket.emit(`${user_id}`, {
                    statusCode: 200,
                    message: "Message sent succesfully",
                    idempotency_key: data.idempotency_key,
                    chat: saved_chat
                });
                socket.broadcast.emit(`${data.patient_id}-${data.physician_id}`, saved_chat);
            }
            catch (error) {
                console.log(error);
                const user_id = data.is_physician ? data.physician_id : (data.is_patient ? data.patient_id : null);
                socket.broadcast.emit(`${user_id}`, {
                    statusCode: 500,
                    message: "Internal Server Error",
                    idempotency_key: data.idempotency_key
                });
            }
        }));
    });
}
catch (err) {
    console.log('Caught error while trying to yse socket ', err);
}
if (!constants_1.redis_url) {
    throw new Error("Redis url not found");
}
const redis_client = new ioredis_1.default(constants_1.redis_url); // Initialize Redis client
redis_client.on('error', (err) => {
    console.log("Error encountered while connecting to redis.".red.bold, err);
});
redis_client.on('connect', () => {
    console.log(`Redis connection established successfully.`.cyan.bold);
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