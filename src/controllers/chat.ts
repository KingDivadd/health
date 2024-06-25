import { NextFunction , Request, Response} from "express";
import { CustomRequest, UserInterface } from "../helpers/interface";
import prisma from '../helpers/prisma'
import {redis_client} from '../helpers/prisma'
import ChatModel from "../models/chatCollection";
import redisFunc from "../helpers/redisFunc";
import {general_physician_chat_amount, 
        general_physician_chat_percentage, 
        specialist_physician_chat_amount, 
        specialist_physician_chat_percentage, jwt_secret, redis_url } from "../helpers/constants";

const jwt = require('jsonwebtoken')
const {redisCallStore, redisAuthStore} = redisFunc


class Chat {

    getChats = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        try {
            const {patient_id, physician_id} = req.params
            let user_id = ''
            const user = req.account_holder.user
            if (user.patient_id){
                user_id = user.patient_id
            }else if (user.physician_id){
                user_id = user.physician_id
            }
            if (![patient_id, physician_id].includes(user_id)){
                return res.status(401).json({err: `You are not allowed to view another user's chat messages`})
            }

            const chats = await ChatModel.find({patient_id, physician_id})

            return res.status(200).json({nbHit: chats.length, chats})

        } catch (err:any) {
            console.log('Error while getting user chats')
            return res.status(500).json({error: `Error occured while getting user chat err_message : ${err}`})
        }
    }

    openChat = async(req:CustomRequest, res: Response, next: NextFunction)=>{
        const {appointment_id, physician_id, text, media} = req.body

        try {
            // first we check if a chat collection between the patient and physician exist, if yes we fetch if no we create a new one
            const patient_id = req.account_holder.user.patient_id
            const chatExist:any = await ChatModel.findOne({
                $and: [
                        { patient_id  },
                        { physician_id},
                    ]
            })
            if (chatExist){
                return res.status(200).json({message: 'Fetching Chat ', chat: chatExist})
            }

            const new_chat = await ChatModel.create({
                appointment_id: appointment_id,
                patient_id: patient_id,
                physician_id: physician_id,
                text: text,
                media: media
            })
            return res.status(200).json({message: 'Creating new chat', chat: new_chat})

        } catch (err:any) {
            console.log('Error during chat creation',err)
            return res.status(500).json({err: 'Error during chat creation ',error:err})
        }
    }

    // stil need to use joi to ensure that the right values are added tot he field
    validateChat = async (data: any): Promise<{ statusCode: number; message: string; } | null> => {
        try {
            const requiredFields = ['appointment_id', 'text', 'media', 'physician_id', 'patient_id'];
    
            // Check if all required fields are present
            for (const field of requiredFields) {
                if (!(field in data)) {
                    return { statusCode: 422, message: `Missing field: ${field}` };
                }
            }
            
            // If all required fields are present, return null (indicating no errors)
            return data;
        } catch (err) {
            console.log(err);
            return { statusCode: 500, message: 'Internal Server Error' }; // Return a generic error message and status code
        }
    };
    
    verifyUserAuth = async (auth_id: string): Promise<{ statusCode: number; data?: any; message?: string }> => {
        try {
            if (!auth_id) {
                return { statusCode: 401, message: 'x-id-key is missing' };
            }
    
            const value = await redis_client.get(`${auth_id}`);
            if (!value) {
                return { statusCode: 404, message: 'Auth session id expired. Please generate OTP.' };
            }
    
            const decode_value = await jwt.verify(JSON.parse(value), jwt_secret);
            return { statusCode: 200, data: decode_value.user }; // Return decoded value as data
        } catch (err) {
            console.error(err);
            return { statusCode: 500, message: 'Internal Server Error' };
        }
    };

    // accountDeduction = async (data: any)=>{
    //     try {
    //         const patient_id = data.patient_id
    //         const patient = await prisma.account.findFirst({
    //             where: {patient_id},
    //         })
    //         if (patient){
    //             const update_account = await prisma.account.update({
    //                 where: {
    //                     account_id: patient.account_id // Assuming account_id is unique
    //                 },
    //                 data: {
    //                     available_balance: {
    //                         decrement: Number(chat_amount),
    //                     }
    //                 }
    //             });
    //         }

    //     } catch (err) {
            
    //     }
    // }

    accountDeduction = async (userAuth:any, data: any) => {
        try {
            // if the sender is a physician, nothing happens to the patient account balance.
            if (userAuth.physician_id){
                return {statusCode: 200, message: 'Physician Account remained as it were'}
            }
            
            // only deduct from patient's account if the sender is patient
            const patient_id = data.patient_id;
            const physician_id = data.physician_id

            const [patient, physician] = await Promise.all([ prisma.account.findFirst({ where: { patient_id } }), 
                                                                prisma.physician.findFirst({where: { physician_id }})])
            
            if (!patient) {
                return {statusCode: 404, message: 'Patient account not found'}
            }
            if (!physician) {
                return {statusCode: 404, message: 'Physician not found'}
            }

            // if the physician is a specialist
            if (physician.speciality  !== 'general_doctor'){ 


                if (patient?.available_balance < Number(specialist_physician_chat_amount)){
                    return {statusCode: 401, message: 'Available balace is low, please top up your balance' }
                }
                const update_account = await prisma.account.update({
                    where: {account_id: patient.account_id},
                    data: {available_balance: patient.available_balance - Number(specialist_physician_chat_amount)}
                })
                
                // if the physician is a general_doctor
            }else if (physician.speciality === 'general_doctor'){
                if (patient?.available_balance < Number(general_physician_chat_amount)){
                    return {statusCode: 401, message: 'Available balace is low, please top up your balance' }
                }
                const update_account = await prisma.account.update({
                    where: {account_id: patient.account_id},
                    data: {available_balance: patient.available_balance - Number(general_physician_chat_amount)}
                })
                
                return {statusCode: 200, message: 'Account updated successfully'}
            }
            // when the doctor is not registered as a specialist or a general doctor
            else if (physician?.speciality === ''){   
                return {statusCode: 401, message: `Only doctors who are sepecialist or general doctors can attend to patients speciality ${physician.speciality} `}
            }
            
        } catch (err:any) {
            return {statusCode: 500, message: `Error during patient account deduction error : ${err}`}
        }
    };

    accountAddition = async (userAuth:any, data:any,)=>{
        try {
            if (userAuth.physician_id){
                return {statusCode: 200, message: 'Account remainded as it were'}
            }

            const [physician, account] = await Promise.all([ prisma.physician.findFirst({ where: {physician_id: data.physician_id} }),
                                                                prisma.account.findFirst({ where: {physician_id: data.physician_id} }) ])

            if (!account) { return {statusCode: 404, message: 'Physician account not found.'} }
                                                                
            let earned_amount: number = 0;
            
            if (physician?.speciality !== 'general_doctor'){
                earned_amount = specialist_physician_chat_amount * (specialist_physician_chat_percentage / 100);   // earned_amount = 90
            } else if (physician?.speciality == 'general_doctor'){
                earned_amount = general_physician_chat_amount * (general_physician_chat_percentage / 100);   // earned_amount = 60
            }

            
            const physician_account = await prisma.account.update({
                where: { account_id: account?.account_id }, 
                data: {
                    available_balance: {
                        increment: earned_amount
                    }
                }
            });

            return {statusCode: 200, message: 'Account updated successfully'}

        } catch (err: any) {
            console.error("Error updating physician's account balance:", err);
            return {statusCode: 500, message: `Error during physician account updating error : ${err}`}
        }
    }
    
    
    
    createChat = async (data: any, userAuth: any) => {
        try {
            const { idempotency_key, appointment_id, patient_id, physician_id, text, media } = data;
    
            const user = userAuth
            let is_patient:boolean = false;
            let is_physician:boolean = false;
            if (user.patient_id){
                is_patient = true

            }else if (user.physician_id){
                is_physician = true

            }
            const chat = new ChatModel({ idempotency_key, appointment_id, patient_id, physician_id, text, media, is_patient, is_physician });
    
            const saved_chat = await chat.save();
    
            return { statusCode: 200, data: saved_chat };
        } catch (error) {
            console.log('Error creating chat:', error);
            return { statusCode: 500, message: `Failed to create chat, reason : ${error} ${{data}}` };
        }
    };

    clearChat = async(req: Request, res: Response, next: NextFunction)=>{
        try {
            const {appointment_id} = req.params

            const chats:any = await ChatModel.deleteMany({appointment_id})
            
            return res.status(200).json({msg: 'Appointment deleted successfully.', chats})
        } catch (err) {
            console.log('err')
        }
    }

    changeUserAvailability = async(user_id:string) =>{
        try {
            if (!user_id) {
                return  {statusCode:404, message: 'user_id is missing' }
            }
            const availability = {is_avialable: false}
            const life_time = 30 * 30 * 1/2
            const availability_status = await redisCallStore(user_id,availability, life_time)
            console.log('availability status ',availability_status)
            if (!availability_status){
                return {statusCode: 400, message: "something went wrong."}
            }

            return {statusCode: 200, message: "User availability stored successfully", value: availability_status}
        } catch (error:any) {
            return { statusCode: 500, message: `Error occured while checking receivers availability` };
        }
    }
    
}


export default new Chat