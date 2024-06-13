import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import generateOTP, { generateReferralCode } from '../helpers/generateOTP';
import { salt_round } from '../helpers/constants';
import redisFunc from '../helpers/redisFunc';
import { CustomRequest } from '../helpers/interface';
import { sendMailOtp } from '../helpers/email';
import { sendSMSOtp } from '../helpers/sms';
import convertedDatetime from '../helpers/currrentDateTime';
import auth from '../helpers/auth';
const { Decimal } = require('decimal.js')
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()


class Notification {

    allNotifications = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        try {
            const user = req.account_holder.user
            const patient_id = user.patient_id || null
            const physician_id = user.physician_id || null

            const all_notification = await prisma.notification.findMany({
                where: {
                    patient_id, physician_id
                }
            })

            return res.status(200).json({nbHit: all_notification.length, notification: all_notification})
        } catch (err:any) {
            console.log(`Error fetching all notifications err: `, err)
            return res.status(500).json({err: `Error fetching all notifications err: `, error: err})
            }
            }
            
    filterNotification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        const {status} = req.body
        try {
            const user = req.account_holder.user
            const patient_id = user.patient_id
            const physician_id = user.physician_id

            const notification = await prisma.notification.findMany({
                where: {
                    status, patient_id, physician_id
                }
            })

            return res.status(200).json({nbHit: notification.length, notification})

        } catch (err: any) {
            console.log(`Error fltering notifications err: `, err)
            return res.status(500).json({err: `Error filtering notifications err: `, error: err})
        }
    }
            
    deleteNotification = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        try {
            const {notificationId} = req.params
            const user = req.account_holder.user

            const notificationExist = await prisma.notification.findUnique({
                where: {notification_id: notificationId}
            })

            if (!notificationExist){
                return res.status(404).json({err: 'Selected notification not found, might be deleted.'})
            }

            if (notificationExist && (notificationExist?.patient_id !== user.patient_id || notificationExist?.physician_id !== user.physician_id)){
                return res.status(401).json({err: `You're not authorized to deleted selected notification.`})
            }

            const removeNotification = await prisma.notification.delete({
                where: {
                    notification_id: notificationId,
                    patient_id: user.patient_id,
                    physician_id: user.physician_id
                }
            })

            return res.status(200).json({msg: "Selected notification deleted successfully."})
        } catch (err:any) {
            console.log(`Error deleting selected err: `, err)
            return res.status(500).json({err: `Error deleting selected error err: `, error: err})
        }
    }
}

export default new Notification