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
class PatientValidation {
    constructor() {
        this.patientSignupValidation = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const validate_new_patient = joi_1.default.object({
                    last_name: joi_1.default.string().trim().required(),
                    first_name: joi_1.default.string().trim().required(),
                    other_names: joi_1.default.string().trim().allow('').optional(),
                    email: joi_1.default.string().trim().email().required(),
                    password: joi_1.default.string().trim().required()
                });
                const { error: validation_error } = validate_new_patient.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                return res.status(422).json({ err: 'Error during patient signup data validation.' });
            }
        });
        this.patientUpdateCompletionValidation = (req, res, next) => {
            try {
                const gender_enum = ['male', 'female'];
                const validate_patient_data = joi_1.default.object({
                    gender: joi_1.default.string().trim().valid(...gender_enum).required(),
                    date_of_birth: joi_1.default.string().trim().required(),
                    country_code: joi_1.default.string().trim().required(),
                    phone_number: joi_1.default.string().trim().required(),
                    referral_code: joi_1.default.string().trim().allow('').optional(),
                });
                const { error: validation_error } = validate_patient_data.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during patient data update validation.' });
            }
        };
        this.patientOrgProfileCompletionValidation = (req, res, next) => {
            try {
                const validate_patient_data = joi_1.default.object({
                    organization_name: joi_1.default.string().trim().required(),
                    organization_type: joi_1.default.string().trim().allow('').optional(),
                    position_held: joi_1.default.string().trim().required(),
                    organization_size: joi_1.default.number().required(),
                    company_website_link: joi_1.default.string().trim().allow("").optional(),
                    phone_number: joi_1.default.string().trim().required(),
                    address: joi_1.default.string().trim().required(),
                    country: joi_1.default.string().trim().allow('').optional(),
                    country_code: joi_1.default.string().trim().required(),
                    cac_document: joi_1.default.string().trim().required(),
                    registration_document: joi_1.default.string().trim().required(),
                    referral_code: joi_1.default.string().trim().allow('').optional()
                });
                const { error: validation_error } = validate_patient_data.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during patient data update validation.' });
            }
        };
        this.patientLoginValidation = (req, res, next) => {
            try {
                const validate_patient_login = joi_1.default.object({
                    email: joi_1.default.string().trim().required(),
                    password: joi_1.default.string().trim().required()
                });
                const { error: validation_error } = validate_patient_login.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                return res.status(422).json({ err: 'Error during patient login data validation.' });
            }
        };
        this.patientEditValidation = (req, res, next) => {
            try {
                const gender_enum = ['male', 'female'];
                const validate_patient_data = joi_1.default.object({
                    gender: joi_1.default.string().allow('').trim().valid(...gender_enum).optional(),
                    blood_group: joi_1.default.string().trim().allow('').optional(),
                    genotype: joi_1.default.string().trim().allow('').optional(),
                    avatar: joi_1.default.string().trim().allow('').optional(),
                    country: joi_1.default.string().trim().allow('').optional(),
                    state: joi_1.default.string().trim().allow('').optional(),
                    country_code: joi_1.default.string().trim().allow('').optional(),
                    phone_number: joi_1.default.string().trim().allow('').optional(),
                });
                const { error: validation_error } = validate_patient_data.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during patient data update validation.' });
            }
        };
        this.encryptedDataValidation = (req, res, next) => {
            try {
                const validate_encrypted_data = joi_1.default.object({
                    encrypted_data: joi_1.default.string().trim().required(),
                });
                const { error: validation_error } = validate_encrypted_data.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during data encryption validation.' });
            }
        };
        this.bookAppointmentValidation = (req, res, next) => {
            try {
                const mode_of_consult_enum = ['physical', 'virtual'];
                const appointment_type_enum = ['chat', 'video_call'];
                const schema = joi_1.default.object({
                    physician_id: joi_1.default.string().trim().required(),
                    mode_of_consult: joi_1.default.string().valid('virtual', 'physical').required(),
                    appointment_type: joi_1.default.when('mode_of_consult', {
                        is: 'virtual',
                        then: joi_1.default.string().valid('chat', 'video_call').required(),
                        otherwise: joi_1.default.forbidden()
                    }),
                    complain: joi_1.default.string().trim().required(),
                    time: joi_1.default.number().required()
                });
                const { error: validation_error } = schema.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during book appoitment validation.' });
            }
        };
        this.filterNotificationValidation = (req, res, next) => {
            try {
                const schema = joi_1.default.object({
                    status: joi_1.default.string().trim().valid('pending', 'completed').required(),
                });
                const { error: validation_error } = schema.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(400).json({ err: error_message });
                }
                next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during filtering notification validation.' });
            }
        };
    }
}
exports.default = new PatientValidation;
//# sourceMappingURL=patientValidation.js.map