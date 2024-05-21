import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import redisFunc from '../helpers/redisFunc';
import { CustomRequest } from '../helpers/interface';
import { videsdk_api_key, videsdk_secret_key } from '../helpers/constants';
import axios from 'axios';
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

class VideoChat {
    
    generateVideoSdkToken = (req: CustomRequest, res: Response, next: NextFunction)=>{
        const {appointment_id} = req.body
        try {
            const user = req.account_holder.user
            const user_boo = {patient: false, physician: false}
            let user_id = ''
            if (user.patient_id){
                user_id = user.patient_id
                user_boo.patient = true
            }else if (user.physician_id){
                user_id = user.physician_id
                user_boo.physician = true
            }
            const options = { 
                expiresIn: '120m', 
                algorithm: 'HS256' 
            };
            const payload = {
                appointment_id,
                apikey: videsdk_api_key,
                permissions: [`allow_join`], // `ask_join` || `allow_mod` 
                version: 2, //OPTIONAL
                roomId: `2kyv-gzay-64pg`, //OPTIONAL
                participantId: user_id, //OPTIONAL 
                is_patient: user_boo.patient,
                is_physician: user_boo.physician,
                roles: ['crawler', 'rtc'], //OPTIONAL
            };

            const token = jwt.sign(payload, videsdk_secret_key, options);
            return res.status(200).json({token})
        } catch (err) {
            console.log(`Error occured while generating video sdk jwt token err: ${err}`,err)
            return res.status(500).json({err: `Error occured while generating video sdk jwt token err: ${err}`})
        }
    }

    createMeeting = async(req: Request, res: Response, next: NextFunction)=>{
        const {token} = req.body
        try {

            const headers = {
                "Authorization": token,
                "Content-Type": "application/json",
            };
            
            const body = { 
                userMeetingId: "unicorn" 
            }

            const url= "https://api.videosdk.live/v1/meetings"
            
            const response = await axios.post(url, body, {headers})

            const result = response.data

            console.log(result)

            return res.status(200).json({msg: 'Created a new meeting',meeting:result})

        } catch (err:any) {
            console.log(`Error occured while creating meeting err:`,err.response.data)
            return res.status(err.response.data.statusCode).json({err:`${err.response.data.error}`})
        }
    }

    joinMeeting = async (req: Request, res: Response, next: NextFunction) => {
        const { token, meetingId } = req.body;
        
            if (!token || !meetingId) {
            return res.status(400).json({ error: 'Token and Meeting ID are required' });
            }
        
            try {
                const headers = {
                    "Authorization": token,
                    "Content-Type": "application/json",
                };
        
            const url = `https://api.videosdk.live/v1/meetings/${meetingId}`;
        
            console.log('Token:', token);
            console.log('Meeting ID:', meetingId);
        
            const response = await axios.get(url, { headers });
        
            const result = response.data;
        
            return res.status(200).json({msg: 'Fetching meeting',meeting:result });
            } catch (err: any) {
            console.log('Error occurred while joining meeting:', err.response?.data || err.message,);
            return res.status(500).json({ error: err.response?.data || 'An error occurred' });
            }
        };

    // createRoom = async (req: Request, res: Response, next: NextFunction) => {
    //     const {token} = req.body
    //     try {
    //         const headers = {
    //             "Authorization": token,
    //             "Content-Type": "application/json",
    //         }

    //         const body = {
    //             "customRoomId" : "aaa-bbb-ccc",
    //             "webhook" : "see example",
    //             "autoCloseConfig" : "see example",
    //             "autoStartConfig" : "see example",
    //             "multiComposition" : "multiCompositionObj"
    //         }

    //         const url= `https://api.videosdk.live/v2/rooms`;
    //         const response = await axios.post(url, body, {headers});
    //         const result = response.data

    //         return res.status(200).json({msg: 'room created successfully', room: result})
    //     } catch (err:any) {
    //         console.log(`Error occurred while creating room: ${err}`,err.response);
    //         return res.status(500).json({ err: `Error occurred while creating room: ${err.response.data}` });
    //     }
    // }

    createRoom = async (req: Request, res: Response, next: NextFunction) => {
        const { token } = req.body;
            try {
                const headers = {
                    Authorization: token,
                    "Content-Type": "application/json",
                };
                const body = {
                    "customRoomId" : "aaa-bbb-ccc",
                    "webhook" : "example.webhook",
                    "autoCloseConfig" : "example",
                    "autoStartConfig" : "example",
                    "multiComposition" : "multiCompositionObj"
                };
                const url= `https://api.videosdk.live/v2/rooms`;
                const response = await axios.post(url, body, { headers });
                const result = response.data;
                return res.status(200).json({ msg: "room created successfully", room: result });
            } catch (err: any) {
                console.log(`Error occurred while creating room: ${err}`, err.response);
                if (err.response && err.response.data) {
                    return res.status(500).json({ err: err.response.data });
                } else {
                    return res.status(500).json({ err: "Error creating room" });
                }
            }
        };

}
export default new VideoChat