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
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = require("ioredis");
const client_1 = require("@prisma/client");
const constants_1 = require("./constants");
const jwt = require('jsonwebtoken');
if (!constants_1.redis_url) {
    throw new Error('REDIS URL not found');
}
const redis_client = new ioredis_1.Redis(constants_1.redis_url);
const prisma = new client_1.PrismaClient();
class Auth {
    constructor() {
        this.emailExist = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                const patient_exist_promise = prisma.patient.findUnique({
                    where: { email }
                });
                const physician_exist_promise = prisma.physician.findUnique({
                    where: { email }
                });
                const [patient_exist, physician_exist] = yield Promise.all([patient_exist_promise, physician_exist_promise]);
                if (patient_exist || physician_exist) {
                    return res.status(500).json({ err: 'email already registered to another user' });
                }
                return next();
            }
            catch (err) {
                console.log('error in patient email exist check : ', err);
                return res.status(500).json({ err: 'error verifying email availability, due to poor internet connection.' });
            }
        });
        this.isRegisteredPatient = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                const is_registered = yield prisma.patient.findUnique({
                    where: { email }
                });
                if (!is_registered) {
                    return res.status(404).json({ err: `User with email ${req.body.email} not found` });
                }
                req.registered_patient = is_registered;
                if (is_registered.phone_number && is_registered.country_code) {
                    req.phone_number = is_registered.country_code + is_registered.phone_number;
                }
                return next();
            }
            catch (err) {
                console.log('Error verifying users registration status : ', err);
                throw err;
            }
        });
        this.isRegisteredPhysician = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                const is_registered = yield prisma.physician.findUnique({
                    where: { email }
                });
                if (!is_registered) {
                    return res.status(404).json({ err: `User with email ${req.body.email} not found` });
                }
                req.registered_physician = is_registered.physician_id;
                if (is_registered.phone_number) {
                    req.phone_number = is_registered.phone_number;
                }
                return next();
            }
            catch (err) {
                console.log('Error verifying users registration status : ', err);
                throw err;
            }
        });
        this.isPatientVerified = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                const user = yield prisma.patient.findUnique({
                    where: {
                        email
                    }
                });
                if (!(user === null || user === void 0 ? void 0 : user.is_verified)) {
                    return res.status(401).json({ err: 'Your account is not verified, please verify before proceeding' });
                }
                req.verifiedPatient = user;
                return next();
            }
            catch (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(410).json({ err: `verification jwt token expired, generate and verify a new OTP` });
                }
                console.error('Error in isVerified function : ', err);
                throw err;
            }
        });
        this.isPhysicianVerified = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const physician = req.account_holder.user;
                if (!(physician === null || physician === void 0 ? void 0 : physician.is_verified)) {
                    return res.status(401).json({ err: 'Your account is not verified, please verify before proceeding' });
                }
                req.verifiedPhysician = physician;
                return next();
            }
            catch (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(410).json({ err: `verification jwt token expired, generate and verify a new OTP` });
                }
                console.error('Error in isVerified function : ', err);
                throw new Error(err);
            }
        });
        this.verifyAuthId = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const auth_id = req.headers['x-id-key'];
                if (!auth_id) {
                    return res.status(404).json({ err: 'x-id-key is missing' });
                }
                const value = yield redis_client.get(`${auth_id}`);
                if (!value) {
                    return res.status(404).json({ err: `auth session id expired, please generate otp` }); // generate otp again or login
                }
                const decode_value = yield jwt.verify(JSON.parse(value), constants_1.jwt_secret);
                req.account_holder = decode_value;
                return next();
            }
            catch (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(410).json({ err: `jwt token expired, regenerate OTP` });
                }
                console.error('Error in isVerified function : ', err);
                throw new Error(err);
            }
        });
        this.verifyOtpId = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                const value = yield redis_client.get(`${email}`);
                if (!value) {
                    return res.status(404).json({ err: "OTP session id has expired, generate a new OTP and re verify..." });
                }
                const otp_data = yield jwt.verify(JSON.parse(value), constants_1.jwt_secret);
                req.otp_data = otp_data;
                req.user_email = otp_data.email;
                return next();
            }
            catch (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(410).json({ err: `jwt token expired, generate and verify OTP`, error: err });
                }
                console.log(err);
                return res.status(500).json({ err: 'Internal server error', error: err });
            }
        });
        this.isLoggedIn = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const auth_id = req.headers['x-id-key'];
                if (!auth_id) {
                    return res.status(404).json({ err: 'x-id-key is missing' });
                }
                const value = yield redis_client.get(`${auth_id}`);
                if (!value) {
                    return res.status(404).json({ err: `auth session id has expired, please login again to continue.` }); // generate otp again or login again
                }
                const decode_value = yield jwt.verify(JSON.parse(value), constants_1.jwt_secret);
                req.account_holder = decode_value;
                return next();
            }
            catch (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(410).json({ err: `jwt token expired, generate regenerate OTP` });
                }
                console.error('Error in isVerified function : ', err);
                throw err;
            }
        });
        this.isFundSufficient = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // we'll integrate an api here to check if the minimum funds required for a meeting/consultation is available
                return next();
            }
            catch (err) {
                console.error('Error in isFundSufficient function : ', err);
                throw err;
            }
        });
        this.isAuthorized = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // asuming the user is logged in and authorized to perform the operation
                return next();
            }
            catch (err) {
                console.error('Error in checking if user is athorized : ', err);
                throw err;
            }
        });
        this.paymentMade = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // include api to check if payments has been made, if yes
                return next();
            }
            catch (err) {
                console.log(err);
                return res.status(500).json({ err: 'error verifying payment for prescription.' });
            }
        });
    }
}
exports.default = new Auth;
//# sourceMappingURL=auth.js.map