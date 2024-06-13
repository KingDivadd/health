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
class ChatValidation {
    constructor() {
        this.endMeetingSessionValid = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const schema = joi_1.default.object({
                    roomId: joi_1.default.string().trim().required(),
                    sessionId: joi_1.default.string().trim().required()
                });
                const { error: validation_error } = schema.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(422).json({ err: error_message });
                }
                return next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error durring end meeting session fields validation.' });
            }
        });
        this.removeParticipantValid = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const schema = joi_1.default.object({
                    participantId: joi_1.default.string().trim().required(),
                    roomId: joi_1.default.string().trim().required(),
                    sessionId: joi_1.default.string().trim().required()
                });
                const { error: validation_error } = schema.validate(req.body);
                if (validation_error) {
                    const error_message = validation_error.message.replace(/"/g, '');
                    return res.status(422).json({ err: error_message });
                }
                return next();
            }
            catch (err) {
                console.log(err);
                return res.status(422).json({ err: 'Error durring participant removal fields validation.' });
            }
        });
    }
}
exports.default = new ChatValidation;
//# sourceMappingURL=chatValidation.js.map