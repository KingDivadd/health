import { Request, Response, NextFunction } from 'express'
import generateOTP, { generateReferralCode } from '../helpers/generateOTP';
import { CustomRequest } from '../helpers/interface';
import prisma from '../helpers/prisma'


class Notification {

    allNotifications = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        try {
            const user = req.account_holder.user
            const patient_id = user.patient_id
            const physician_id = user.physician_id

            const status = ""
            const notification = await prisma.notification.findMany({
                where: {
                    patient_id, physician_id, status: { contains: status, mode: "insensitive" }, notification_for_patient: patient_id ? true : false
                },include: {
                    patient: {
                        select: {last_name: true, first_name: true, other_names: true, avatar: true, gender: true}
                    }, 
                    physician: {
                        select: {last_name: true, first_name: true, other_names: true, avatar: true, gender: true, speciality: true, registered_as: true, bio: true, }
                    },
                    appointment: true,
                    case_note: true,
                    transaction:true
                }, orderBy: {
                    created_at: 'desc'
                },
            })

            return res.status(200).json({nbHit: notification.length, notification})

        } catch (err: any) {
            console.log(`Error fltering notifications err: `, err)
            return res.status(500).json({err: `Error filtering notifications err `, error: err})
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
                    status, patient_id, physician_id, notification_for_patient: patient_id ? true : false
                },include: {
                    patient: {
                        select: {last_name: true, first_name: true, other_names: true, avatar: true, gender: true}
                    }, 
                    physician: {
                        select: {last_name: true, first_name: true, other_names: true, avatar: true, gender: true, speciality: true, registered_as: true, bio: true, }
                    },
                    appointment: true,
                    case_note: true,
                    transaction:true
                }, orderBy: {
                    created_at: 'desc'
                },
            })

            return res.status(200).json({nbHit: notification.length, notification})

        } catch (err: any) {
            console.log(`Error fltering notifications err: `, err)
            return res.status(500).json({err: `Error filtering notifications err `, error: err})
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