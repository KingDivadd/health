"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORS_OPTION = exports.vapid_private_key = exports.vapid_public_key = exports.videosdk_endpoint = exports.videosdk_secret_key = exports.videosdk_api_key = exports.general_physician_chat_percentage = exports.specialist_physician_chat_percentage = exports.specialist_physician_chat_amount = exports.general_physician_chat_amount = exports.chat_amount = exports.passPhrase = exports.msg_amount = exports.paystack_public_key = exports.paystack_secret_key = exports.mongo_uri = exports.termii_api_key = exports.sendgrid_api_key = exports.email_passowrd = exports.email_username = exports.jwt_lifetime = exports.jwt_secret = exports.redis_url = exports.db_url = exports.port = exports.salt_round = void 0;
exports.salt_round = Number(process.env.SALT_ROUND);
exports.port = process.env.PORT;
exports.db_url = process.env.DATABASE_URL;
exports.redis_url = process.env.REDIS_URL;
exports.jwt_secret = process.env.JWT_SECRET;
exports.jwt_lifetime = process.env.JWT_LIFETIME;
exports.email_username = process.env.EMAIL_USERNAME;
exports.email_passowrd = process.env.EMAIL_PASSWORD;
exports.sendgrid_api_key = process.env.SENDGRID_API_KEY;
exports.termii_api_key = process.env.TERMII_API_KEY;
exports.mongo_uri = process.env.MONGO_URI;
exports.paystack_secret_key = process.env.PAYSTACK_SECRET_KEY;
exports.paystack_public_key = process.env.PAYSTACK_PUBLIC_KEY;
exports.msg_amount = process.env.AMOUNT;
exports.passPhrase = process.env.PASSPHRASE;
exports.chat_amount = Number(process.env.CHAT_AMOUNT);
exports.general_physician_chat_amount = Number(process.env.GENERAL_PHYSYCIAN_CHAT_AMOUNT);
exports.specialist_physician_chat_amount = Number(process.env.SPECIALIST_PHYSCIAN_CHAT_AMOUNT);
exports.specialist_physician_chat_percentage = Number(process.env.SPECIALIST_PHYSCIAN_CHAT_PERCENTAGE);
exports.general_physician_chat_percentage = Number(process.env.GENERAL_PHYSYCIAN_CHAT_PERCENTAGE);
exports.videosdk_api_key = process.env.VIDEO_SDK_API_KEY;
exports.videosdk_secret_key = process.env.VIDEO_SDK_API_SECRET;
exports.videosdk_endpoint = process.env.VIDEOSDK_API_ENDPOINT;
exports.vapid_public_key = process.env.VAPID_PUBLIC_KEY;
exports.vapid_private_key = process.env.VAPID_PRIVATE_KEY;
exports.CORS_OPTION = {
    origin: "*",
    credentials: true,
    exposedHeaders: ['x-id-key'],
    optionsSuccessStatus: 200
};
//# sourceMappingURL=constants.js.map