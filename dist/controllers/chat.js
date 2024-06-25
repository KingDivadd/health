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
const prisma_1 = __importDefault(require("../helpers/prisma"));
const prisma_2 = require("../helpers/prisma");
const chatCollection_1 = __importDefault(require("../models/chatCollection"));
const redisFunc_1 = __importDefault(require("../helpers/redisFunc"));
const constants_1 = require("../helpers/constants");
const jwt = require('jsonwebtoken');
const { redisCallStore, redisAuthStore } = redisFunc_1.default;
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
                const value = yield prisma_2.redis_client.get(`${auth_id}`);
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
                // if the sender is a physician, nothing happens to the patient account balance.
                if (userAuth.physician_id) {
                    return { statusCode: 200, message: 'Physician Account remained as it were' };
                }
                // only deduct from patient's account if the sender is patient
                const patient_id = data.patient_id;
                const physician_id = data.physician_id;
                const [patient, physician] = yield Promise.all([prisma_1.default.account.findFirst({ where: { patient_id } }),
                    prisma_1.default.physician.findFirst({ where: { physician_id } })]);
                if (!patient) {
                    return { statusCode: 404, message: 'Patient account not found' };
                }
                if (!physician) {
                    return { statusCode: 404, message: 'Physician not found' };
                }
                // if the physician is a specialist
                if (physician.speciality !== 'general_doctor') {
                    if ((patient === null || patient === void 0 ? void 0 : patient.available_balance) < Number(constants_1.specialist_physician_chat_amount)) {
                        return { statusCode: 401, message: 'Available balace is low, please top up your balance' };
                    }
                    const update_account = yield prisma_1.default.account.update({
                        where: { account_id: patient.account_id },
                        data: { available_balance: patient.available_balance - Number(constants_1.specialist_physician_chat_amount) }
                    });
                    // if the physician is a general_doctor
                }
                else if (physician.speciality === 'general_doctor') {
                    if ((patient === null || patient === void 0 ? void 0 : patient.available_balance) < Number(constants_1.general_physician_chat_amount)) {
                        return { statusCode: 401, message: 'Available balace is low, please top up your balance' };
                    }
                    const update_account = yield prisma_1.default.account.update({
                        where: { account_id: patient.account_id },
                        data: { available_balance: patient.available_balance - Number(constants_1.general_physician_chat_amount) }
                    });
                    return { statusCode: 200, message: 'Account updated successfully' };
                }
                // when the doctor is not registered as a specialist or a general doctor
                else if ((physician === null || physician === void 0 ? void 0 : physician.speciality) === '') {
                    return { statusCode: 401, message: `Only doctors who are sepecialist or general doctors can attend to patients speciality ${physician.speciality} ` };
                }
            }
            catch (err) {
                return { statusCode: 500, message: `Error during patient account deduction error : ${err}` };
            }
        });
        this.accountAddition = (userAuth, data) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (userAuth.physician_id) {
                    return { statusCode: 200, message: 'Account remainded as it were' };
                }
                const [physician, account] = yield Promise.all([prisma_1.default.physician.findFirst({ where: { physician_id: data.physician_id } }),
                    prisma_1.default.account.findFirst({ where: { physician_id: data.physician_id } })]);
                if (!account) {
                    return { statusCode: 404, message: 'Physician account not found.' };
                }
                let earned_amount = 0;
                if ((physician === null || physician === void 0 ? void 0 : physician.speciality) !== 'general_doctor') {
                    earned_amount = constants_1.specialist_physician_chat_amount * (constants_1.specialist_physician_chat_percentage / 100); // earned_amount = 90
                }
                else if ((physician === null || physician === void 0 ? void 0 : physician.speciality) == 'general_doctor') {
                    earned_amount = constants_1.general_physician_chat_amount * (constants_1.general_physician_chat_percentage / 100); // earned_amount = 60
                }
                const physician_account = yield prisma_1.default.account.update({
                    where: { account_id: account === null || account === void 0 ? void 0 : account.account_id },
                    data: {
                        available_balance: {
                            increment: earned_amount
                        }
                    }
                });
                return { statusCode: 200, message: 'Account updated successfully' };
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
        this.clearChat = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { appointment_id } = req.params;
                const chats = yield chatCollection_1.default.deleteMany({ appointment_id });
                return res.status(200).json({ msg: 'Appointment deleted successfully.', chats });
            }
            catch (err) {
                console.log('err');
            }
        });
        this.changeUserAvailability = (user_id) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!user_id) {
                    return { statusCode: 404, message: 'user_id is missing' };
                }
                const availability = { is_avialable: false };
                const life_time = 30 * 30 * 1 / 2;
                const availability_status = yield redisCallStore(user_id, availability, life_time);
                console.log('availability status ', availability_status);
                if (!availability_status) {
                    return { statusCode: 400, message: "something went wrong." };
                }
                return { statusCode: 200, message: "User availability stored successfully", value: availability_status };
            }
            catch (error) {
                return { statusCode: 500, message: `Error occured while checking receivers availability` };
            }
        });
    }
}
exports.default = new Chat;
//# sourceMappingURL=chat.js.map