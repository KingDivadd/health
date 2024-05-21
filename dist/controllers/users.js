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
const redisFunc_1 = __importDefault(require("../helpers/redisFunc"));
const currrentDateTime_1 = __importDefault(require("../helpers/currrentDateTime"));
const prisma = new client_1.PrismaClient();
const { redisValueUpdate } = redisFunc_1.default;
class Users {
    constructor() {
        this.loggedInPatient = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.account_holder.user;
                const fetched_user = yield prisma.patient.findUnique({
                    where: { patient_id: user.patient_id }
                });
                const auth_id = req.headers['x-id-key'];
                res.setHeader('x-id-key', auth_id);
                return res.status(200).json({ logged_in_user: user });
            }
            catch (err) {
                console.log('Error while fetching user data ', err);
                return res.status(500).json({ err: 'Internal server error while signing in patient', error: err });
            }
        });
        this.loggedInPhysician = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.account_holder.user;
                const fetched_user = yield prisma.physician.findUnique({
                    where: { physician_id: user.physician_id }
                });
                const auth_id = req.headers['x-id-key'];
                res.setHeader('x-id-key', auth_id);
                return res.status(200).json({ logged_in_user: user });
            }
            catch (err) {
                console.log('Error while fetching user data ', err);
                return res.status(500).json({ err: 'Internal server error while signing in physician', error: err });
            }
        });
        this.signupUpdatePatientData = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { date_of_birth, country_code, phone_number } = req.body;
            try {
                if (req.body.date_of_birth) {
                    req.body.date_of_birth = (0, currrentDateTime_1.default)(date_of_birth);
                }
                req.body.updated_at = (0, currrentDateTime_1.default)();
                const patient_id = req.account_holder.user.patient_id;
                const user = yield prisma.patient.update({
                    where: {
                        patient_id
                    },
                    data: req.body
                });
                req.user_email = req.account_holder.user.email;
                if (user.phone_number && user.country_code) {
                    req.phone_number = user.country_code + user.phone_number;
                }
                return next();
            }
            catch (err) {
                console.log('Error during patient profile update or edit ', err);
                return res.status(500).json({ err: 'Internal server error during patient profile update', error: err });
            }
        });
        this.editPatientData = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { date_of_birth, country_code, phone_number } = req.body;
            const auth_id = req.headers['x-id-key'];
            try {
                req.body.date_of_birth = (0, currrentDateTime_1.default)(date_of_birth);
                req.body.updated_at = (0, currrentDateTime_1.default)();
                const patient_id = req.account_holder.user.patient_id;
                const updated_patient_data = yield prisma.patient.update({
                    where: {
                        patient_id
                    },
                    data: req.body
                });
                const new_auth_id = yield redisValueUpdate(auth_id, updated_patient_data, 60 * 60 * 23);
                res.setHeader('x-id-key', new_auth_id);
                return res.status(200).json({ msg: 'Profile updated successfully', user: new_auth_id });
            }
            catch (err) {
                console.log('Error during patient profile update or edit ', err);
                return res.status(500).json({ err: 'Internal server error during patient data update', error: err });
            }
        });
        this.singupUpdatePhysicianData = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { date_of_birth, country_code, phone_number } = req.body;
            try {
                req.body.date_of_birth = (0, currrentDateTime_1.default)(date_of_birth);
                req.body.updated_at = (0, currrentDateTime_1.default)();
                const physician_id = req.account_holder.user.physician_id;
                const user = yield prisma.physician.update({
                    where: {
                        physician_id
                    },
                    data: req.body
                });
                req.user_email = req.account_holder.user.email;
                if (user.phone_number && user.country_code) {
                    req.phone_number = user.country_code + user.phone_number;
                }
                return next();
            }
            catch (err) {
                console.log('Error during patient profile update or edit ', err);
                return res.status(500).json({ err: 'Internal server error' });
            }
        });
        this.editPhysicianData = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { date_of_birth, phone_number, country_code } = req.body;
            try {
                const auth_id = req.headers['x-id-key'];
                req.body.date_of_birth = (0, currrentDateTime_1.default)(date_of_birth);
                req.body.updated_at = (0, currrentDateTime_1.default)();
                const physician_id = req.account_holder.user.physician_id;
                const updated_physician_data = yield prisma.physician.update({
                    where: {
                        physician_id
                    },
                    data: req.body
                });
                const new_auth_id = yield redisValueUpdate(auth_id, updated_physician_data, 60 * 60 * 12);
                res.setHeader('x-id-key', new_auth_id);
                return res.status(200).json({ msg: 'Profile updated successfully', user: updated_physician_data });
            }
            catch (err) {
                console.log('Error during patient profile update or edit ', err);
                return res.status(500).json({ err: 'Internal server error' });
            }
        });
        this.allPhysicians = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { page_number } = req.params;
            try {
                const [number_of_physicians, physicians] = yield Promise.all([
                    prisma.physician.count({}),
                    prisma.physician.findMany({
                        skip: (Number(page_number) - 1) * 15,
                        take: 15,
                        orderBy: {
                            created_at: 'desc'
                        }
                    })
                ]);
                const number_of_pages = (number_of_physicians <= 15) ? 1 : Math.ceil(number_of_physicians / 15);
                return res.status(200).json({ message: 'Physicians', data: { total_number_of_physicians: number_of_physicians, total_number_of_pages: number_of_pages, physicians: physicians } });
            }
            catch (err) {
                console.error('Error fetching all physicians ', err);
                return res.status(500).json({ err: 'Internal server err' });
            }
        });
        this.filterPhysicians = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { name, registered_as, speciality } = req.body;
            const { page_number } = req.params;
            try {
                const [number_of_physicians, physicians] = yield Promise.all([
                    prisma.physician.count({
                        where: {
                            OR: [
                                { last_name: { contains: name, mode: "insensitive" } },
                                { first_name: { contains: name, mode: "insensitive" } },
                                { other_names: { contains: name, mode: "insensitive" } }
                            ],
                            registered_as: { contains: registered_as, mode: "insensitive" },
                            speciality: { contains: speciality, mode: "insensitive" }
                        }
                    }),
                    prisma.physician.findMany({
                        where: {
                            OR: [
                                { last_name: { contains: name, mode: "insensitive" } },
                                { first_name: { contains: name, mode: "insensitive" } },
                                { other_names: { contains: name, mode: "insensitive" } }
                            ],
                        },
                        skip: (Number(page_number) - 1) * 15,
                        take: 15,
                        orderBy: {
                            created_at: 'desc'
                        }
                    })
                ]);
                const number_of_pages = (number_of_physicians <= 15) ? 1 : Math.ceil(number_of_physicians / 15);
                return res.status(200).json({ message: 'Physicians', data: { total_number_of_physicians: number_of_physicians, total_number_of_pages: number_of_pages, physicians: physicians } });
            }
            catch (err) {
                console.error('Error fetching all physicians ', err);
                return res.status(500).json({ err: 'Internal server err' });
            }
        });
    }
}
exports.default = new Users;
//# sourceMappingURL=users.js.map