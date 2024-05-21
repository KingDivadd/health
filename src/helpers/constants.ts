export const salt_round = Number(process.env.SALT_ROUND)
export const port = process.env.PORT
export const db_url = process.env.DATABASE_URL
export const redis_url = process.env.REDIS_URL
export const jwt_secret = process.env.JWT_SECRET
export const jwt_lifetime = process.env.JWT_LIFETIME
export const email_username = process.env.EMAIL_USERNAME
export const email_passowrd = process.env.EMAIL_PASSWORD
export const sendgrid_api_key = process.env.SENDGRID_API_KEY
export const termii_api_key = process.env.TERMII_API_KEY
export const mongo_uri = process.env.MONGO_URI
export const paystack_secret_key = process.env.PAYSTACK_SECRET_KEY
export const paystack_public_key = process.env.PAYSTACK_PUBLIC_KEY
export const msg_amount = process.env.AMOUNT
export const passPhrase = process.env.PASSPHRASE
export const chat_amount = Number(process.env.CHAT_AMOUNT)
export const specialist_percentage  = Number(process.env.SPECIALIST_PHYSCIAN_CHAT_PERCENTAGE)
export const general_physician_percentage  = Number(process.env.GENERAL_PHYSYCIAN_CHAT_PERCENTAGE)
export const videsdk_api_key = process.env.VIDEO_SDK_API_KEY
export const videsdk_secret_key = process.env.VIDEO_SDK_API_SECRET
export const public_vipid_key = process.env.VAVID_PUBLIC_KEY
export const private_vipid_key = process.env.VAVID_PRIVATE_KEY


export const CORS_OPTION ={
    origin: "*",
    credentials: true,
    exposedHeaders: ['x-id-key'],
    optionsSuccessStatus: 200
}