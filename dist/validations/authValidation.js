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
exports.videoCallNotAnsweredValidation = exports.videoChatValidation = exports.chatValidation = void 0;
const joi_1 = __importDefault(require("joi"));
class HelperValidation {
    constructor() {
        this.genOtpValidation = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                const validate_otp_generation = joi_1.default.object({
                    email: joi_1.default.string().trim().required()
                });
                const { error: validation_error } = validate_otp_generation.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(422).json({ err: error_message });
                }
                return next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error unique code generation validation.' });
            }
        });
        this.verifyOtpValidation = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const validate_otp_validation = joi_1.default.object({
                    email: joi_1.default.string().trim().required(),
                    otp: joi_1.default.string().trim().required()
                });
                const { error: validation_error } = validate_otp_validation.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(422).json({ err: error_message });
                }
                return next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during unique code verification validation.' });
            }
        });
        this.passwordUpdateValidation = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const validate_password = joi_1.default.object({
                    new_password: joi_1.default.string().trim().required()
                });
                const { error: validation_error } = validate_password.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(422).json({ err: error_message });
                }
                return next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error during password update validation' });
            }
        });
    }
}
exports.default = new HelperValidation;
const chatValidation = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            idempotency_key: joi_1.default.string().trim().required(),
            appointment_id: joi_1.default.string().trim().required(),
            physician_id: joi_1.default.string().trim().required(),
            patient_id: joi_1.default.string().trim().required(),
            is_physician: joi_1.default.boolean().required(),
            is_patient: joi_1.default.boolean().required(),
            text: joi_1.default.string().allow('').optional(),
            token: joi_1.default.string().required(),
            media: joi_1.default.array()
        });
        const value = yield schema.validateAsync(Object.assign({}, data));
        return ({
            status: true,
            data: value,
            message: 'validated succesfully',
            statusCode: 401,
        });
    }
    catch (error) {
        console.log(error);
        return ({
            status: false,
            statusCode: 422,
            message: error.details[0].message,
            error: error.details[0].message,
        });
    }
});
exports.chatValidation = chatValidation;
const videoChatValidation = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            meetingId: joi_1.default.string().trim().required(),
            physician_id: joi_1.default.string().trim().required(),
            patient_id: joi_1.default.string().trim().required(),
            is_physician: joi_1.default.boolean().required(),
            is_patient: joi_1.default.boolean().required(),
        });
        const value = yield schema.validateAsync(Object.assign({}, data));
        return ({
            status: true,
            data: value,
            message: 'validated succesfully',
            statusCode: 401,
        });
    }
    catch (error) {
        console.log(error);
        return ({
            status: false,
            statusCode: 422,
            message: error.details[0].message,
            error: error.details[0].message,
        });
    }
});
exports.videoChatValidation = videoChatValidation;
const videoCallNotAnsweredValidation = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            meeting_id: joi_1.default.string().trim().required(),
            receiver_id: joi_1.default.string().trim().required(),
            caller_id: joi_1.default.string().trim().required,
            token: joi_1.default.string().trim().required,
        });
        const value = yield schema.validateAsync(Object.assign({}, data));
        return ({
            status: true,
            data: value,
            message: 'validated succesfully',
            statusCode: 401,
        });
    }
    catch (error) {
        console.log(error);
        return ({
            status: false,
            statusCode: 422,
            message: error.details[0].message,
            error: error.details[0].message,
        });
    }
});
exports.videoCallNotAnsweredValidation = videoCallNotAnsweredValidation;
//# sourceMappingURL=authValidation.js.map