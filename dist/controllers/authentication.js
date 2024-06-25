"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const generateOTP_1 = __importStar(require("../helpers/generateOTP"));
const constants_1 = require("../helpers/constants");
const redisFunc_1 = __importDefault(require("../helpers/redisFunc"));
const email_1 = require("../helpers/email");
const sms_1 = require("../helpers/sms");
const currrentDateTime_1 = __importDefault(require("../helpers/currrentDateTime"));
const { Decimal } = require('decimal.js');
const bcrypt = require('bcrypt');
const prisma_1 = __importDefault(require("../helpers/prisma"));
const { redisAuthStore, redisOtpStore, redisValueUpdate, redisOtpUpdate, redisDataDelete } = redisFunc_1.default;
class Authentication {
    constructor() {
        this.patientSignup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { last_name, first_name, other_names, email } = req.body;
            try {
                const encrypted_password = yield bcrypt.hash(req.body.password, constants_1.salt_round);
                const user = yield prisma_1.default.patient.create({
                    data: {
                        other_names: other_names,
                        last_name: last_name,
                        first_name: first_name,
                        email: email,
                        password: encrypted_password,
                        referral_code: (0, generateOTP_1.generateReferralCode)(),
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)(),
                    }
                });
                if (user && user.patient_id) {
                    yield prisma_1.default.account.create({
                        data: {
                            available_balance: 0,
                            patient_id: user === null || user === void 0 ? void 0 : user.patient_id,
                            created_at: (0, currrentDateTime_1.default)(),
                            updated_at: (0, currrentDateTime_1.default)(),
                        }
                    });
                }
                const x_id_key = yield redisAuthStore(user, 60 * 60 * 23);
                res.setHeader('x-id-key', x_id_key);
                console.log('user ', user);
                return res.status(201).json({ msg: 'User created successfully, proceed to continuing setting up your profile' });
            }
            catch (err) {
                console.error('Error during patient signup : ', err);
                return res.status(500).json({ err: 'Internal server error.', error: err });
            }
        });
        this.physicianSignup = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { last_name, first_name, other_names, email } = req.body;
            try {
                const encrypted_password = yield bcrypt.hash(req.body.password, constants_1.salt_round);
                const user = yield prisma_1.default.physician.create({
                    data: {
                        other_names: other_names,
                        last_name: last_name,
                        first_name: first_name,
                        email: email,
                        password: encrypted_password,
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)()
                    }
                });
                if (user != null) {
                    yield prisma_1.default.account.create({
                        data: {
                            available_balance: 0,
                            physician_id: user === null || user === void 0 ? void 0 : user.physician_id,
                            created_at: (0, currrentDateTime_1.default)(),
                            updated_at: (0, currrentDateTime_1.default)(),
                        }
                    });
                }
                const x_id_key = yield redisAuthStore(user, 60 * 60 * 23);
                res.setHeader('x-id-key', x_id_key);
                return res.status(201).json({ msg: 'User created successfully, proceed to continuing setting up your profile' });
            }
            catch (err) {
                console.error('Error during physician signup : ', err);
                return res.status(500).json({ err: 'Internal server error.', error: err });
            }
        });
        this.patientLogin = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                console.log(1);
                const user = yield prisma_1.default.patient.findUnique({
                    where: { email }
                });
                console.log(2);
                if (!user) {
                    console.log(3);
                    return res.status(404).json({ err: 'Incorrect email address, check email and try again' });
                }
                console.log(4);
                if (!(user === null || user === void 0 ? void 0 : user.is_verified)) {
                    return res.status(401).json({ msg: 'Your account is not verified, please verify before proceeding', is_verified: user.is_verified });
                }
                console.log(5);
                const encrypted_password = user.password;
                const match_password = yield bcrypt.compare(password, encrypted_password);
                if (!match_password) {
                    return res.status(401).json({ err: `Incorrect password, correct password and try again.` });
                }
                const new_auth_id = yield redisAuthStore(user, 60 * 60 * 23);
                console.log(6);
                res.setHeader('x-id-key', new_auth_id);
                console.log(7);
                return res.status(200).json({ msg: "Login successful", user_data: user });
            }
            catch (err) {
                console.log('Error during patient login', err);
                return res.status(500).json({ err: 'Internal server error' });
            }
        });
        this.physicianLogin = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                console.log(11);
                const user = yield prisma_1.default.physician.findUnique({
                    where: { email }
                });
                console.log(22);
                if (!user) {
                    console.log(33);
                    return res.status(404).json({ err: 'Incorrect email address' });
                }
                console.log(44);
                if (!(user === null || user === void 0 ? void 0 : user.is_verified)) {
                    console.log(55);
                    return res.status(401).json({ msg: 'Your account is not verified, please verify before proceeding', is_verified: user.is_verified });
                }
                console.log(66);
                const encrypted_password = user.password;
                const match_password = yield bcrypt.compare(password, encrypted_password);
                if (!match_password) {
                    return res.status(401).json({ err: `Incorrect password, correct password and try again.` });
                }
                console.log(77);
                const new_auth_id = yield redisAuthStore(user, 60 * 60 * 23);
                res.setHeader('x-id-key', new_auth_id);
                console.log(88);
                return res.status(200).json({ msg: "Login successful", user_data: user, });
            }
            catch (err) {
                console.log('Error during physician login', err);
                return res.status(500).json({ err: 'Internal server error', error: err, });
            }
        });
        this.signupGenerateUserOTP = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const otp = (0, generateOTP_1.default)();
                const email = req.user_email;
                if (!email) {
                    throw new Error('email not found');
                }
                yield redisOtpStore(email, otp, 'unverified', 60 * 60 * 1 / 6); // otp valid for 10min
                (0, email_1.sendMailOtp)(email, otp);
                if (req.phone_number) {
                    (0, sms_1.sendSMSOtp)(req.phone_number, otp);
                }
                return res.status(201).json({ msg: `A six digit unique code has been sent to you, and it is only valid for 10min` });
            }
            catch (err) {
                console.error('Error during token generation : ', err);
                return res.status(500).json({ err: 'Internal server error.' });
            }
        });
        this.generateUserOTP = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                const otp = (0, generateOTP_1.default)();
                yield redisOtpStore(email, otp, 'unverified', 60 * 60 * 1 / 6); // otp valid for 10min
                (0, email_1.sendMailOtp)(email, otp);
                if (req.phone_number) {
                    (0, sms_1.sendSMSOtp)(req.phone_number, otp);
                }
                return res.status(201).json({ msg: `A six digit unique code has been sent to you, and it is only valid for 10min` });
            }
            catch (err) {
                console.error('Error during token generation : ', err);
                return res.status(500).json({ err: 'Internal server error.' });
            }
        });
        this.verifyPatientOTP = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { otp, email } = req.body;
            try {
                const otp_data = req.otp_data;
                if (otp !== otp_data.sent_otp) {
                    return res.status(401).json({ err: 'Incorrect otp provided' });
                }
                const user_promise = prisma_1.default.patient.update({
                    where: {
                        email: req.otp_data.email
                    },
                    data: {
                        is_verified: true,
                        updated_at: (0, currrentDateTime_1.default)()
                    }
                });
                const auth_id_promise = redisAuthStore((yield user_promise), 60 * 60 * 12);
                const [user, auth_id] = yield Promise.all([user_promise, auth_id_promise]);
                res.setHeader('x-id-key', auth_id);
                return res.status(200).json({ msg: 'Verification successful' });
            }
            catch (err) {
                console.error('Error in verifying otp:', err);
                return res.status(500).json({ err: "Internal server error" });
            }
        });
        this.verifyPhysicianOTP = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { otp, otp_id } = req.body;
            try {
                const otp_data = req.otp_data;
                if (otp !== otp_data.sent_otp) {
                    return res.status(401).json({ err: 'Incorrect otp provided', otp_id });
                }
                const user_promise = prisma_1.default.physician.update({
                    where: {
                        email: req.otp_data.email
                    },
                    data: {
                        is_verified: true,
                        updated_at: (0, currrentDateTime_1.default)()
                    }
                });
                const auth_id_promise = redisAuthStore((yield user_promise), 60 * 60 * 12);
                const [user, auth_id] = yield Promise.all([user_promise, auth_id_promise]);
                res.setHeader('x-id-key', auth_id);
                return res.status(200).json({ msg: 'Verification successful' });
            }
            catch (err) {
                console.error('Error in verifying otp:', err);
                return res.status(500).json({ err: "Internal server error" });
            }
        });
        this.resetPatientPassword = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { new_password } = req.body;
            try {
                const auth_id = req.headers['x-id-key'];
                const encrypted_password_promise = bcrypt.hash(new_password, 10);
                const update_user_promise = prisma_1.default.patient.update({
                    where: {
                        patient_id: req.account_holder.user.patient_id
                    },
                    data: {
                        password: yield encrypted_password_promise,
                        updated_at: (0, currrentDateTime_1.default)()
                    }
                });
                const useful_time = 60 * 60 * 23;
                const [encrypted_password, update_user, x_id_key] = yield Promise.all([encrypted_password_promise, update_user_promise, redisValueUpdate(auth_id, (yield update_user_promise), useful_time)]);
                res.setHeader('x-id-key', x_id_key);
                return res.status(200).json({ msg: 'Password updated successfully' });
            }
            catch (err) {
                console.error('Error in verify otp:', err);
                throw err;
            }
        });
        this.resetPhysicianPassword = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { new_password } = req.body;
            try {
                const auth_id = req.headers['x-id-key'];
                const encrypted_password_promise = bcrypt.hash(new_password, 10);
                const update_user_promise = prisma_1.default.physician.update({
                    where: {
                        physician_id: req.account_holder.user.physician_id
                    },
                    data: {
                        password: yield encrypted_password_promise,
                        updated_at: (0, currrentDateTime_1.default)()
                    }
                });
                const useful_time = 60 * 60 * 23;
                const [encrypted_password, update_user, x_id_key] = yield Promise.all([encrypted_password_promise, update_user_promise, redisValueUpdate(auth_id, (yield update_user_promise), useful_time)]);
                res.setHeader('x-id-key', x_id_key);
                return res.status(200).json({ msg: 'Password updated successfully' });
            }
            catch (err) {
                console.error('Error in verify otp:', err);
                throw err;
            }
        });
    }
}
exports.default = new Authentication;
//# sourceMappingURL=authentication.js.map