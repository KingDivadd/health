import { Request, Response, NextFunction } from 'express'
import generateOTP, { generateReferralCode } from '../helpers/generateOTP';
import { salt_round } from '../helpers/constants';
import redisFunc from '../helpers/redisFunc';
import { CustomRequest } from '../helpers/interface';
import { sendMailOtp } from '../helpers/email';
import { sendSMSOtp } from '../helpers/sms';
import convertedDatetime from '../helpers/currrentDateTime';
const { Decimal } = require('decimal.js')
const bcrypt = require('bcrypt')
import prisma from '../helpers/prisma'

const { redisAuthStore, redisOtpStore, redisValueUpdate, redisOtpUpdate, redisDataDelete } = redisFunc

class Authentication {

    patientSignup = async (req: Request, res: Response, next: NextFunction) => {
        const { last_name, first_name, other_names, email } = req.body;
        try {
            const encrypted_password = await bcrypt.hash(req.body.password, salt_round);
            const user:any = await prisma.patient.create({
                data: {
                    other_names: other_names,
                    last_name: last_name,
                    first_name: first_name,
                    email: email,
                    password: encrypted_password,
                    referral_code: generateReferralCode(),
                    created_at: convertedDatetime(),
                    updated_at: convertedDatetime(),

                }
            });
            if (user && user.patient_id){
                await prisma.account.create({
                    data:{
                        available_balance: 0,
                        patient_id: user?.patient_id,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                })
            }
            const x_id_key = await redisAuthStore(user, 60 * 60 * 23)
            res.setHeader('x-id-key', x_id_key)
            console.log('user ',user)
            return res.status(201).json({msg: 'User created successfully, proceed to continuing setting up your profile.'})
        } catch (err: any) {
            console.error('Error during patient signup : ', err);
            return res.status(500).json({ err: 'Internal server error.', error: err });
        }
    }

    physicianSignup = async (req: Request, res: Response, next: NextFunction) => {
        const { last_name,first_name, other_names, email } = req.body;
        try {
            const encrypted_password = await bcrypt.hash(req.body.password, salt_round);
            const user:any = await prisma.physician.create({
                data: {
                    other_names: other_names,
                    last_name: last_name,
                    first_name: first_name,
                    email: email,
                    password: encrypted_password,
                    created_at: convertedDatetime(),
                    updated_at: convertedDatetime()
                }
            });
            if (user != null){
                await prisma.account.create({
                    data:{
                        available_balance: 0,
                        physician_id: user?.physician_id,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                })
            }

            const x_id_key = await redisAuthStore(user, 60 * 60 * 23)
            res.setHeader('x-id-key', x_id_key)
            return res.status(201).json({msg: 'User created successfully, proceed to continuing setting up your profile'})
        } catch (err:any) {
            console.error('Error during physician signup : ', err);
            return res.status(500).json({ err: 'Internal server error.', error: err });
        }
    }

    patientLogin = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { email, password } = req.body
        try {
            console.log(1)
            const user:any = await prisma.patient.findUnique({
                where: {email}
            })
            console.log(2)
            if (!user){
                console.log(3)
                return res.status(404).json({err: 'Incorrect email address, check email and try again'})
            }
            console.log(4)
            if (!user?.is_verified) {
                return res.status(401).json({ msg: 'Your account is not verified, please verify before proceeding',  is_verified: user.is_verified })
            }
            console.log(5)
            
            const encrypted_password = user.password
            const match_password: boolean = await bcrypt.compare(password, encrypted_password)
            if (!match_password) {
                return res.status(401).json({ err: `Incorrect password, correct password and try again.` })
            }
            const new_auth_id:any = await redisAuthStore(user, 60 * 60 * 23)
            
            console.log(6)
            res.setHeader('x-id-key', new_auth_id)
            console.log(7)

            return res.status(200).json({ msg: "Login successful", user_data: user })
        } catch (err) {
            console.log('Error during patient login', err)
            return res.status(500).json({ err: 'Internal server error' })
        }
    }

    physicianLogin = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { email, password } = req.body
        try {
            console.log(11)
            const user:any = await prisma.physician.findUnique({
                where: {email}
            })
            console.log(22)
            if (!user){
                console.log(33)
                return res.status(404).json({err: 'Incorrect email address'})
            }
            console.log(44)
            if (!user?.is_verified) {
                console.log(55)
                return res.status(401).json({ msg: 'Your account is not verified, please verify before proceeding',  is_verified: user.is_verified })
            }  
            
            console.log(66)
            const encrypted_password = user.password
            const match_password: boolean = await bcrypt.compare(password, encrypted_password)
            if (!match_password) {
                return res.status(401).json({ err: `Incorrect password, correct password and try again.` })
            }
            console.log(77)
            const new_auth_id:any = await redisAuthStore(user, 60 * 60 * 23)
            
            res.setHeader('x-id-key', new_auth_id)
            console.log(88)

            return res.status(200).json({ msg: "Login successful", user_data: user, })
        } catch (err) {
            console.log('Error during physician login', err)
            return res.status(500).json({ err: 'Internal server error',error:err, })
        }
    }

    signupGenerateUserOTP = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const otp = generateOTP()
            const email = req.user_email
            if (!email){
                throw new Error('email not found')
            }
            await redisOtpStore(email, otp, 'unverified', 60 * 60 * 1/6) // otp valid for 10min

            sendMailOtp(email, otp)
            if (req.phone_number) {
                sendSMSOtp(req.phone_number, otp)
            }

            return res.status(201).json({ msg: `A six digit unique code has been sent to you, and it is only valid for 10min`})
        } catch (err) {
            console.error('Error during token generation : ', err);
            return res.status(500).json({ err: 'Internal server error.' });
        }

    }
    
    generateUserOTP = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { email } = req.body
        try {
            const otp = generateOTP()
            await redisOtpStore(email, otp, 'unverified', 60 * 60 * 1/6) // otp valid for 10min

            sendMailOtp(email, otp)
            if (req.phone_number) {
                sendSMSOtp(req.phone_number, otp)
            }
            
            return res.status(201).json({ msg: `A six digit unique code has been sent to you, and it is only valid for 10min`})
        } catch (err) {
            console.error('Error during token generation : ', err);
            return res.status(500).json({ err: 'Internal server error.' });
        }

    }

    verifyPatientOTP = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { otp, email } = req.body
        try {
            const otp_data = req.otp_data

            if (otp !== otp_data.sent_otp) {
                return res.status(401).json({ err: 'Incorrect otp provided'})
            }

            const user_promise: any = prisma.patient.update({
                where: {
                    email: req.otp_data.email
                },
                data:{
                    is_verified: true,
                    updated_at: convertedDatetime()
                }
            })

            const auth_id_promise = redisAuthStore((await user_promise), 60 * 60 * 12);
            const [ user, auth_id] = await Promise.all([ user_promise, auth_id_promise ])

            res.setHeader('x-id-key', auth_id)


            return res.status(200).json({ msg: 'Verification successful' })

        } catch (err) {
            console.error('Error in verifying otp:', err);
            return res.status(500).json({ err: "Internal server error" })
        }
    }

    verifyPhysicianOTP = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { otp, otp_id } = req.body
        try {
            const otp_data = req.otp_data

            if (otp !== otp_data.sent_otp) {
                return res.status(401).json({ err: 'Incorrect otp provided', otp_id })
            }

            const user_promise: any = prisma.physician.update({
                where: {
                    email: req.otp_data.email
                },
                data:{
                    is_verified: true,
                    updated_at: convertedDatetime()
                }
            })
            
            const auth_id_promise = redisAuthStore((await user_promise), 60 * 60 * 12);
            const [ user, auth_id] = await Promise.all([ user_promise, auth_id_promise ])

            res.setHeader('x-id-key', auth_id)

            return res.status(200).json({ msg: 'Verification successful' })
        } catch (err) {
            console.error('Error in verifying otp:', err);
            return res.status(500).json({ err: "Internal server error" })
        }
    }
    
    resetPatientPassword = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { new_password } = req.body
        try {
            const auth_id = req.headers['x-id-key'];
            const encrypted_password_promise = bcrypt.hash(new_password, 10);
            const update_user_promise = prisma.patient.update({
                where: {
                    patient_id: req.account_holder.user.patient_id
                },
                data: {
                    password: await encrypted_password_promise,
                    updated_at: convertedDatetime()
                }
            })

            const useful_time: number = 60 * 60 * 23;
            const [encrypted_password, update_user, x_id_key]:any = await Promise.all([encrypted_password_promise, update_user_promise, redisValueUpdate(auth_id, (await update_user_promise), useful_time)])

            res.setHeader('x-id-key', x_id_key)

            return res.status(200).json({ msg: 'Password updated successfully'})

        } catch (err) {
            console.error('Error in verify otp:', err);
            throw err;
        }
    }
    
    resetPhysicianPassword = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { new_password } = req.body
        try {
            const auth_id = req.headers['x-id-key'];
            const encrypted_password_promise = bcrypt.hash(new_password, 10);
            const update_user_promise = prisma.physician.update({
                where: {
                    physician_id: req.account_holder.user.physician_id
                },
                data: {
                    password: await encrypted_password_promise,
                    updated_at: convertedDatetime()
                }
            })

            const useful_time: number = 60 * 60 * 23;
            const [encrypted_password, update_user, x_id_key]:any = await Promise.all([encrypted_password_promise, update_user_promise, redisValueUpdate(auth_id, (await update_user_promise), useful_time)])

            res.setHeader('x-id-key', x_id_key)

            return res.status(200).json({ msg: 'Password updated successfully'})

        } catch (err) {
            console.error('Error in verify otp:', err);
            throw err;
        }
    }
}

export default new Authentication