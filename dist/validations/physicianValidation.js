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
const joi_1 = __importDefault(require("joi"));
class PhysicianValidation {
    constructor() {
        this.physicianSignupValidation = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const validate_new_physician = joi_1.default.object({
                    last_name: joi_1.default.string().trim().required(),
                    first_name: joi_1.default.string().trim().required(),
                    other_names: joi_1.default.string().trim().allow('').optional(),
                    email: joi_1.default.string().email().trim().required(),
                    password: joi_1.default.string().trim().required()
                });
                const { error: validation_error } = validate_new_physician.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (error) {
                return res.status(422).json({ err: 'Error during physician signup data validation' });
            }
        });
        this.physicianLoginValidation = (req, res, next) => {
            try {
                const validate_physician_login = joi_1.default.object({
                    email: joi_1.default.string().trim().required(),
                    password: joi_1.default.string().trim().required()
                });
                const { error: validation_error } = validate_physician_login.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                return res.status(422).json({ err: 'Error during physician signup data validation' });
            }
        };
        this.physicianSetupProfileValidation = (req, res, next) => {
            try {
                const gender_enum = ['male', 'female'];
                const registered_as = ['specialist', 'hospital', 'laboratory', 'pharmacy'];
                const speciality = ['dentist', 'oncologist', 'neurologist', 'nutritionist', 'general_doctor', 'surgeon'];
                const validate_physician_data = joi_1.default.object({
                    registered_as: joi_1.default.string().trim().required(),
                    speciality: joi_1.default.string().trim().required(),
                    gender: joi_1.default.string().allow('').trim().valid(...gender_enum).required(),
                    date_of_birth: joi_1.default.string().trim().required(),
                    country_code: joi_1.default.string().trim().required(),
                    phone_number: joi_1.default.string().trim().required(),
                    address: joi_1.default.string().trim().required(),
                    state: joi_1.default.string().trim().required(),
                    country: joi_1.default.string().trim().required(),
                    avatar: joi_1.default.string().trim().allow('').optional(),
                    medical_license: joi_1.default.string().trim().allow('').optional(),
                    cac_document: joi_1.default.string().trim().allow('').optional(),
                    professional_credentials: joi_1.default.string().trim().allow('').optional(),
                    verification_of_employment: joi_1.default.string().trim().allow('').optional()
                });
                const { error: validation_error } = validate_physician_data.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during physician data update validation' });
            }
        };
        this.physicianDataValidation = (req, res, next) => {
            try {
                const gender_enum = ['male', 'female'];
                const registered_as = ['specialist', 'hospital', 'laboratory', 'pharmacy'];
                const speciality = ['dentist', 'oncologist', 'neurologist', 'nutritionist', 'general_doctor', 'surgeon'];
                const validate_physician_data = joi_1.default.object({
                    registered_as: joi_1.default.string().trim().required(),
                    speciality: joi_1.default.string().trim().required(),
                    gender: joi_1.default.string().allow('').trim().valid(...gender_enum).required(),
                    date_of_birth: joi_1.default.string().trim().allow().optional(),
                    country_code: joi_1.default.string().trim().allow('').optional(),
                    phone_number: joi_1.default.string().trim().allow('').optional(),
                    bio: joi_1.default.string().trim().allow('').optional(),
                    address: joi_1.default.string().trim().required(),
                    state: joi_1.default.string().trim().allow('').optional(),
                    country: joi_1.default.string().trim().allow('').optional(),
                    avatar: joi_1.default.string().trim().allow('').optional(),
                    medical_license: joi_1.default.string().trim().allow('').optional(),
                    professional_credentials: joi_1.default.string().trim().allow('').optional(),
                    verification_of_employment: joi_1.default.string().trim().allow('').optional()
                });
                const { error: validation_error } = validate_physician_data.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during physician data update validation' });
            }
        };
        this.filterPhysicianValidation = (req, res, next) => {
            try {
                const gender_enum = ['male', 'female'];
                const registered_as = ['specialist', 'hospital', 'laboratory', 'pharmacy'];
                const speciality = ['dentist', 'general_doctor', 'nutritionist', 'oncologist', 'surgeon'];
                const validate_physician_data = joi_1.default.object({
                    name: joi_1.default.string().allow('').optional(),
                    gender_enum: joi_1.default.string().allow('').valid(...gender_enum).optional(),
                    registered_as: joi_1.default.string().allow('').optional(),
                    speciality: joi_1.default.string().allow('').optional(),
                });
                const { error: validation_error } = validate_physician_data.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during filter physician data validation' });
            }
        };
        this.filterAppointmentValidation = (req, res, next) => {
            try {
                const schema = joi_1.default.object({
                    status: joi_1.default.string().trim().allow('').valid('accepted', 'denieds').optional(),
                });
                const { error: validation_error } = schema.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                return next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during filter physician data validation' });
            }
        };
        this.acceptAppointmentValidation = (req, res, next) => {
            try {
                const validate_appointment = joi_1.default.object({
                    appointment_id: joi_1.default.string().trim().required(),
                    status: joi_1.default.string().trim().valid('accepted', 'denied').required()
                });
                const { error: validation_error } = validate_appointment.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during accepting appoitment validation.' });
            }
        };
    }
}
exports.default = new PhysicianValidation;
//# sourceMappingURL=physicianValidation.js.map