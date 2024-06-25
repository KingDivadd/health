import { Request, Response, NextFunction } from 'express'
import prisma from './prisma'
import {redis_client} from './prisma'
import { CustomRequest } from '../helpers/interface'
import { jwt_secret } from './constants'
const jwt = require('jsonwebtoken')



class Auth {
    emailExist = async (req: Request, res: Response, next: NextFunction) => {
        const { email } = req.body
        try {
            const patient_exist_promise = prisma.patient.findUnique({
                where: {email}
            })

            const physician_exist_promise = prisma.physician.findUnique({
                where: {email}
            })
            const [patient_exist, physician_exist] = await Promise.all([patient_exist_promise, physician_exist_promise])
            if (patient_exist || physician_exist) {
                return res.status(500).json({ err: 'email already registered to another user' })
            }
            return next()
        } catch (err) {
            console.log('error in patient email exist check : ', err)
            return res.status(500).json({ err: 'error verifying email availability, due to poor internet connection.' })
        }
    }

    isRegisteredPatient = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { email } = req.body
        try {
            const is_registered = await prisma.patient.findUnique({
                where: {email}
            })
            if (!is_registered) {
                return res.status(404).json({ err: `User with email ${req.body.email} not found` })
            }
            req.registered_patient = is_registered
            if (is_registered.phone_number && is_registered.country_code){
                req.phone_number = is_registered.country_code + is_registered.phone_number
            }

            return next()

        } catch (err) {
            console.log('Error verifying users registration status : ', err)
            throw err
        }
    }

    isRegisteredPhysician = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { email } = req.body
        try {
            const is_registered = await prisma.physician.findUnique({
                where: {email}
            })
            if (!is_registered) {
                return res.status(404).json({ err: `User with email ${req.body.email} not found` })
            }
            req.registered_physician = is_registered.physician_id
            if (is_registered.phone_number){
                req.phone_number = is_registered.phone_number
            }
            return next()

        } catch (err) {
            console.log('Error verifying users registration status : ', err)
            throw err
        }
    }

    isPatientVerified = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const {email} = req.body
        try {
            const user = await prisma.patient.findUnique({
                where:{
                    email
                }
            })
            if (!user?.is_verified) {
                return res.status(401).json({ err: 'Your account is not verified, please verify before proceeding' })
            }
            req.verifiedPatient = user
            return next()
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                return res.status(410).json({ err: `verification jwt token expired, generate and verify a new OTP` })
            }
            console.error('Error in isVerified function : ', err);
            throw err;
        }
    }
    
    isPhysicianVerified = async (req: CustomRequest, res: Response, next: NextFunction) => {

        try {
            const physician = req.account_holder.user
            if (!physician?.is_verified) {
                return res.status(401).json({ err: 'Your account is not verified, please verify before proceeding' })
            }
            req.verifiedPhysician = physician
            
            return next()
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                return res.status(410).json({ err: `verification jwt token expired, generate and verify a new OTP` })
            }
            console.error('Error in isVerified function : ', err);
            throw new Error (err);
        }
    }

    verifyAuthId = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const auth_id = req.headers['x-id-key'];
            if (!auth_id) {
                return res.status(404).json({ err: 'x-id-key is missing' })
            }   
            const value = await redis_client.get(`${auth_id}`)
            if (!value) {
                return res.status(401).json({ err: `auth session id expired, please generate otp`})
            }
            const decode_value = await jwt.verify(JSON.parse(value), jwt_secret)
            
            const patient_id = decode_value.user.patient_id || null
            const physician_id =decode_value.user.physician_id || null
            
            if (patient_id == null && physician_id == null){
                return res.status(401).json({err: 'Please enter the correct x-id-key'})
            }
            
            req.account_holder = decode_value
            return next()
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                return res.status(410).json({ err: `jwt token expired, regenerate OTP` })
            }
            console.error('Error in isVerified function : ', err)
            throw new Error(err);
        }
    }

    verifyOtpId = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const {email} = req.body
        try {
            const value: any = await redis_client.get(`${email}`)
            if (!value){
                return res.status(401).json({err: "OTP session id has expired, generate a new OTP and re verify..."})
            }
            const otp_data = await jwt.verify(JSON.parse(value), jwt_secret)
            req.otp_data = otp_data
            req.user_email = otp_data.email

            return next()
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                return res.status(410).json({ err: `jwt token expired, generate and verify OTP`, error:err })
            }
            console.log(err)
            return res.status(500).json({ err: 'Internal server error', error:err })
        }
    }

    isLoggedIn = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const auth_id = req.headers['x-id-key']
            if (!auth_id) {
                return res.status(404).json({ err: 'x-id-key is missing' })
            }
            const value = await redis_client.get(`${auth_id}`)
            if (!value) {
                return res.status(401).json({ err: `auth session id has expired, please login again to continue.` }) // generate otp again or login again
            }
            const decode_value = await jwt.verify(JSON.parse(value), jwt_secret)
            if (!('user' in decode_value)){
                return res.status(401).json({err: 'Please enter the correct x-id-key'})
            }
            
            const patient_id = decode_value.user.patient_id || null
            const physician_id =decode_value.user.physician_id || null
            
            if (patient_id == null && physician_id == null){
                return res.status(401).json({err: 'Please enter the correct x-id-key'})
            }

            req.account_holder = decode_value
            return next()
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                return res.status(410).json({ err: `jwt token expired, generate regenerate OTP` })
            }
            console.error('Error in isVerified function : ', err)
            throw err;
        }
    }

    isFundSufficient = async (req: Request, res: Response, next: NextFunction) => {
        try {

            // we'll integrate an api here to check if the minimum funds required for a meeting/consultation is available
            return next()
        } catch (err: any) {
            console.error('Error in isFundSufficient function : ', err)
            throw err;
        }
    }

    isAuthorized = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // asuming the user is logged in and authorized to perform the operation
            return next()

        } catch (err) {
            console.error('Error in checking if user is athorized : ', err)
            throw err;
        }
    }


    paymentMade = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // include api to check if payments has been made, if yes
            return next()
        } catch (err) {
            console.log(err)
            return res.status(500).json({ err: 'error verifying payment for prescription.' })
        }
    }
    

    checkUserAvailability = async (user_id:any) => {
        try {
            if (!user_id) {
                return {statusCode: 400, message: "user id not provided to check current availability"}
            }
            const value = await redis_client.get(`${user_id}`)
            console.log('value of stored user ', value)
            if (!value) {
                return ({statusCode: 200, message: "the user you are trying to call is available..."})
            }
            const decoded_value = await jwt.verify(JSON.parse(value), jwt_secret)
            console.log('decoded_value ',decoded_value.availability.is_available)
            if (!decoded_value.availability.is_avialable){
                return {statusCode: 409, message: "The user you are trying to call is currently not available", value: decoded_value}
            }
            return {statusCode: 200, message: "The user you are trying to reach is available", value: decoded_value}
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                return {statusCode: 410, message: 'jwt token expired, generate regenerate OTP'}
            }
        }
    }

    checkUserAvailab = async(req: Request, res: Response, next: NextFunction) => {
        const {user_id} = req.body
        try {
            
            if (!user_id) {
                return res.status(404).json({ err: 'x-id-key is missing' })
            }
            const value = await redis_client.get(`${user_id}`)
            if (!value) {
                return res.status(404).json({ err: `auth session id has expired, please login again to continue.` }) // generate otp again or login again
            }
            const decode_value = await jwt.verify(JSON.parse(value), jwt_secret)
            res.send(decode_value)
            // req.account_holder = decode_value
            // return next()
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                return {statusCode: 410, message: 'jwt token expired, generate regenerate OTP'}
            }
            console.error('Error in isVerified function : ', err)
            // throw err;
        }
    }

}

export default new Auth