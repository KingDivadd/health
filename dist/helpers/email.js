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
exports.sendMailOtp = void 0;
const constants_1 = require("./constants");
const FROM_EMAIL = 'contact@ohealthng.com';
const FROM_NAME = 'Ohealth';
function sendMailOtp(email, otp) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            sgMail.setApiKey(constants_1.sendgrid_api_key);
            const msg = {
                to: email,
                from: { email: FROM_EMAIL, name: FROM_NAME },
                subject: 'Ohealth Verification Code',
                html: `<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {
                text-align: center;
            }
    
            div {
                display: inline-block;
                text-align: left;
            }
        </style>
    </head>
    <body>
        <div>
            <p>Hello,</p>
            <p>Please use the verification code below to verify your email. You can complete your log in with the OTP below.</p>
            
            <strong>One Time Password (OTP)</strong>
            <p><b>${otp}</b></p>
    
            <p>This code expires in 10 minutes and should only be used in-app. Do not click any links or share with anybody.</p>
    
            <p>If you didn’t attempt to register on Ohealth EMR, please change your password immediately to protect your account. For further assistance, contact us at <a href="mailto:support@emr.ohealthng.com">support@emr.ohealthng.com</a>.</p>
    
            <p>Need help, or have questions? Please visit our <a href="ohealthng.com">contact us page</a> or reply to this message.</p>
        </div>
    </body>
    </html>`,
            };
            sgMail
                .send(msg)
                .then(() => {
                console.log(`Email sent to ${email}`.yellow.bold);
            })
                .catch((error) => {
                console.error(`${error}`.red.bold);
            });
        }
        catch (error) {
            console.log(error);
        }
    });
}
exports.sendMailOtp = sendMailOtp;
const sgMail = require('@sendgrid/mail');
//# sourceMappingURL=email.js.map