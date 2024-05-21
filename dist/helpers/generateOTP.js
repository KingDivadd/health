"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = void 0;
function generateOTP() {
    const characters = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        otp += characters.charAt(randomIndex);
    }
    return otp;
}
exports.default = generateOTP;
function generateReferralCode() {
    const characters = '0123456789abcdefchijklmnoopqrstuvwxyz';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        otp += characters.charAt(randomIndex);
    }
    return otp;
}
exports.generateReferralCode = generateReferralCode;
//# sourceMappingURL=generateOTP.js.map