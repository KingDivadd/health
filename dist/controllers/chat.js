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
const client_1 = require("@prisma/client");
const chatCollection_1 = __importDefault(require("../models/chatCollection"));
const ioredis_1 = require("ioredis");
const constants_1 = require("../helpers/constants");
const jwt = require('jsonwebtoken');
if (!constants_1.redis_url) {
    throw new Error('REDIS URL not found');
}
const redis_client = new ioredis_1.Redis(constants_1.redis_url);
const prisma = new client_1.PrismaClient();
class Chat {
    constructor() {
        this.getChats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { patient_id, physician_id } = req.params;
                let user_id = '';
                const user = req.account_holder.user;
                if (user.patient_id) {
                    user_id = user.patient_id;
                }
                else if (user.physician_id) {
                    user_id = user.physician_id;
                }
                if (![patient_id, physician_id].includes(user_id)) {
                    return res.status(401).json({ err: `You are not allowed to view another user's chat messages` });
                }
                const chats = yield chatCollection_1.default.find({ patient_id, physician_id });
                return res.status(200).json({ nbHit: chats.length, chats });
            }
            catch (err) {
                console.log('Error while getting user chats');
                return res.status(500).json({ error: `Error occured while getting user chat err_message : ${err}` });
            }
        });
        this.openChat = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { appointment_id, physician_id, text, media } = req.body;
            try {
                // first we check if a chat collection between the patient and physician exist, if yes we fetch if no we create a new one
                const patient_id = req.account_holder.user.patient_id;
                const chatExist = yield chatCollection_1.default.findOne({
                    $and: [
                        { patient_id },
                        { physician_id },
                    ]
                });
                if (chatExist) {
                    return res.status(200).json({ message: 'Fetching Chat ', chat: chatExist });
                }
                const new_chat = yield chatCollection_1.default.create({
                    appointment_id: appointment_id,
                    patient_id: patient_id,
                    physician_id: physician_id,
                    text: text,
                    media: media
                });
                return res.status(200).json({ message: 'Creating new chat', chat: new_chat });
            }
            catch (err) {
                console.log('Error during chat creation', err);
                return res.status(500).json({ err: 'Error during chat creation ', error: err });
            }
        });
        // stil need to use joi to ensure that the right values are added tot he field
        this.validateChat = (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const requiredFields = ['appointment_id', 'text', 'media', 'physician_id', 'patient_id'];
                // Check if all required fields are present
                for (const field of requiredFields) {
                    if (!(field in data)) {
                        return { statusCode: 422, message: `Missing field: ${field}` };
                    }
                }
                // If all required fields are present, return null (indicating no errors)
                return data;
            }
            catch (err) {
                console.log(err);
                return { statusCode: 500, message: 'Internal Server Error' }; // Return a generic error message and status code
            }
        });
        this.verifyUserAuth = (auth_id) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!auth_id) {
                    return { statusCode: 401, message: 'x-id-key is missing' };
                }
                const value = yield redis_client.get(`${auth_id}`);
                if (!value) {
                    return { statusCode: 404, message: 'Auth session id expired. Please generate OTP.' };
                }
                const decode_value = yield jwt.verify(JSON.parse(value), constants_1.jwt_secret);
                return { statusCode: 200, data: decode_value.user }; // Return decoded value as data
            }
            catch (err) {
                console.error(err);
                return { statusCode: 500, message: 'Internal Server Error' };
            }
        });
        // accountDeduction = async (data: any)=>{
        //     try {
        //         const patient_id = data.patient_id
        //         const patient = await prisma.account.findFirst({
        //             where: {patient_id},
        //         })
        //         if (patient){
        //             const update_account = await prisma.account.update({
        //                 where: {
        //                     account_id: patient.account_id // Assuming account_id is unique
        //                 },
        //                 data: {
        //                     available_balance: {
        //                         decrement: Number(chat_amount),
        //                     }
        //                 }
        //             });
        //         }
        //     } catch (err) {
        //     }
        // }
        this.accountDeduction = (userAuth, data) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (userAuth.patient_id) {
                    const patient_id = data.patient_id;
                    const patient = yield prisma.account.findFirst({
                        where: { patient_id },
                    });
                    if (!patient) {
                        return { statusCode: 404, message: 'Patient account not found' };
                    }
                    if ((patient === null || patient === void 0 ? void 0 : patient.available_balance) < Number(constants_1.chat_amount)) {
                        return { statusCode: 401, message: 'Available balace is low, please top up your balance' };
                    }
                    const update_account = yield prisma.account.update({
                        where: { account_id: patient.account_id },
                        data: { available_balance: patient.available_balance - Number(constants_1.chat_amount) }
                    });
                    return { statusCode: 200, message: 'Account updated successfully' };
                }
                return { statusCode: 200, message: 'Account remained as it were' };
            }
            catch (err) {
                return { statusCode: 500, message: `Error during patient account deduction error : ${err}` };
            }
        });
        this.accountAddition = (userAuth, data) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (userAuth.patient_id) {
                    const physician = yield prisma.physician.findFirst({
                        where: { physician_id: data.physician_id }
                    });
                    let earned_amount = 0;
                    if (physician.registered_as === 'specialist') {
                        earned_amount = constants_1.chat_amount * (constants_1.specialist_percentage / 100);
                    }
                    else if (physician.registered_as === 'general_doctor') {
                        earned_amount = constants_1.chat_amount * (constants_1.general_physician_percentage / 100);
                    }
                    const account = yield prisma.account.findFirst({
                        where: { physician_id: data.physician_id }
                    });
                    const physician_account = yield prisma.account.update({
                        where: { account_id: account === null || account === void 0 ? void 0 : account.account_id },
                        data: {
                            available_balance: {
                                increment: earned_amount
                            }
                        }
                    });
                    return { statusCode: 200, message: 'Account updated successfully' };
                }
                return { statusCode: 200, message: 'Account remainded as it were' };
            }
            catch (err) {
                console.error("Error updating physician's account balance:", err);
                return { statusCode: 500, message: `Error during physician account updating error : ${err}` };
            }
        });
        this.createChat = (data, userAuth) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { idempotency_key, appointment_id, patient_id, physician_id, text, media } = data;
                const user = userAuth;
                let is_patient = false;
                let is_physician = false;
                if (user.patient_id) {
                    is_patient = true;
                }
                else if (user.physician_id) {
                    is_physician = true;
                }
                const chat = new chatCollection_1.default({ idempotency_key, appointment_id, patient_id, physician_id, text, media, is_patient, is_physician });
                const saved_chat = yield chat.save();
                return { statusCode: 200, data: saved_chat };
            }
            catch (error) {
                console.log('Error creating chat:', error);
                return { statusCode: 500, message: `Failed to create chat, reason : ${error} ${{ data }}` };
            }
        });
    }
}
exports.default = new Chat;
//# sourceMappingURL=chat.js.map