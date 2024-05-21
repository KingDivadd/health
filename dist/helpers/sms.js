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
exports.sendSMSOtp = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
function sendSMSOtp(phone_number, otp) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = {
                to: phone_number,
                from: "N-Alert",
                sms: `Hi, your Ohealth verification code is ${otp}. This is a one-time code. If you did not initiate this process, please ignore this message.`,
                type: "plain",
                api_key: constants_1.termii_api_key,
                channel: "dnd",
            };
            yield axios_1.default.post('https://api.ng.termii.com/api/sms/send', data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log(`Otp sent to ${phone_number}`.yellow.bold);
        }
        catch (error) {
            // Handle errors appropriately, such as displaying an error message to the user
            console.log(error);
        }
    });
}
exports.sendSMSOtp = sendSMSOtp;
//# sourceMappingURL=sms.js.map