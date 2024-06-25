import { Request, Response, NextFunction, } from 'express'
import { CustomRequest } from '../helpers/interface';
import { sendMailAcceptedAppointment, sendMailAppointmentCancelled, sendMailAppointmentCancelledByPatient, sendMailAppointmentDenied, sendMailBookingAppointment } from '../helpers/email';
import convertedDatetime, {readableDate} from '../helpers/currrentDateTime';
import { io } from '../index';
import prisma from '../helpers/prisma'
import { videosdk_api_key, videosdk_endpoint, videosdk_secret_key } from '../helpers/constants';
import axios from 'axios';
const jwt = require('jsonwebtoken')

class Appointment {
    bookAppointment = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const patient_id = req.account_holder.user.patient_id;
    
            req.body.patient_id = patient_id;
            req.body.created_at = Date.now();
            req.body.updated_at = Date.now();
    
            // Check if the appointment with the same patient_id already exists
            const existingAppointment = await prisma.appointment.findFirst({
                where: {
                    patient_id: patient_id,
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: 1
            });

            if (existingAppointment !== null) {
                const differenceInMilliseconds = Math.abs(req.body.time - Number(existingAppointment.time));
    
                const differenceInMinutes = differenceInMilliseconds / 60000;
                if (Number(differenceInMinutes) < 30) {
                    return res.status(406).json({ err: 'New Appointment should be at 30 minutes or more after the previous appointment' });
                }
            }
    
            // Create the appointment

            // need to create a meetingid and add to body

            // generating token 
            const options = { expiresIn: "23h", algorithm: "HS256" };
        
            const payload = {
                apikey: videosdk_api_key,
                permissions: ["allow_join", "allow_mod"],
            };
        
            const token = jwt.sign(payload, videosdk_secret_key, options);

            // create meeting
            const response = await axios.post(`${videosdk_endpoint}/v2/rooms`, {},
                {
                    headers: {
                        Authorization: token,
                    }
                }
            )

            const meeting_id = response.data.roomId
            req.body.meeting_id = meeting_id
            const new_appointment = await prisma.appointment.create({
                data: req.body,
                include: {
                    patient: {
                        select: {last_name: true, first_name: true, other_names: true, avatar: true}
                    },
                    physician: {
                        select: {last_name:true, first_name: true, other_names: true, avatar: true, bio: true, speciality: true, registered_as: true, languages_spoken: true, medical_license: true, gender: true, email: true }
                    }
                }
            });

            if (new_appointment){
                sendMailBookingAppointment(new_appointment.physician, new_appointment.patient, new_appointment)
                // create notificaton
                req.body.created_at= convertedDatetime()
                req.body.updated_at= convertedDatetime()
                
                const [patientNotification, physicianNotification] = await Promise.all([prisma.notification.create({
                    data: {
                        appointment_id: new_appointment.appointment_id,
                        patient_id: new_appointment.patient_id,
                        physician_id: new_appointment.physician_id, 
                        case_note_id: null,
                        notification_type: "Appointment",
                        notification_for_patient: true,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                }),prisma.notification.create({
                    data: {
                        appointment_id: new_appointment.appointment_id,
                        patient_id: new_appointment.patient_id,
                        physician_id: new_appointment.physician_id, 
                        case_note_id: null, 
                        notification_type: "Appointment",
                        notification_for_physician: true,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                }) ])

                // send a socket to both patient and physician
                if (patientNotification){
                    io.emit(`notification-${new_appointment.patient_id}`, {
                        statusCode: 200,
                        notificationData: patientNotification,
                    })
                }
                    
                if (physicianNotification){
                    io.emit(`notification-${new_appointment.physician_id}`, {
                        statusCode: 200,
                        notificationData: patientNotification,
                    })
                }
                                
                req.pushNotificationData = {title: 'New Appointment Booking', body: `${new_appointment.patient?.last_name} ${new_appointment.patient?.first_name} has booked an appointment with you`, avatar: new_appointment.patient?.avatar, messge: 'Appointment Created', data: new_appointment}
                
                return next()
            }

        } catch (err: any) {
            console.log('Error occurred during appointment creation error:', err);
            return res.status(500).json({ error: `Error occurred during appointment creation: ${err.message}` });
        }
    }

    updateAppointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        const {appointment_id, status} = req.body
        try {
            const user = req.account_holder.user
            const appointment = await prisma.appointment.findUnique({ where: {appointment_id} })
            
            if (appointment == null || !appointment) {
                return res.status(404).json({err: 'Appointment not found'})
            }
            
            if (!user.physician_id || user.physician_id !== appointment.physician_id){
                return res.status(401).json({err: 'Only doctors booked for an appointment can accept or reject an appointment!'})
            }

            if (appointment.status === 'cancelled'){
                return res.status(409).json({err: 'Appointment already cancelled.'})
            }

            const updateAppointment = await prisma.appointment.update({
                where: {appointment_id},
                data: {status},
                include: {patient: {
                    select: {last_name: true, email: true, first_name: true, avatar: true}
                }, physician: {
                    select: {last_name: true, first_name: true, email: true, avatar: true }
                }}
            })

            if (updateAppointment && updateAppointment.patient && status === 'accepted'){
                // send mail to the patient
                const [patientNotification, physicianNotification] = await Promise.all([prisma.notification.create({
                    data: {
                        notification_type: "Appointment",
                        notification_for_patient: true,
                        appointment_id: updateAppointment.appointment_id,
                        patient_id: updateAppointment.patient_id,
                        physician_id: updateAppointment.physician_id, 
                        case_note_id: null,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                    }),prisma.notification.create({
                    data: {
                        notification_type: "Appointment",
                        notification_for_physician: true,
                        appointment_id: updateAppointment.appointment_id,
                        patient_id: updateAppointment.patient_id,
                        physician_id: updateAppointment.physician_id, 
                        case_note_id: null,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                }) ])

                if (patientNotification){
                    io.emit(`notification-${updateAppointment.patient_id}`, {
                        statusCode: 200,
                        notificationData: patientNotification,
                    })
                }
                
                if (physicianNotification){
                    io.emit(`notification-${updateAppointment.physician_id}`, {
                        statusCode: 200,
                        notificationData: physicianNotification,
                    })
                }


                req.pushNotificationData = {title: 'Appointment Update', body: `Dr ${updateAppointment.physician?.last_name} ${updateAppointment.physician?.first_name} has accepted your appointment.`, avatar: updateAppointment.physician?.avatar, messge: 'Appointment', data: updateAppointment}


                sendMailAcceptedAppointment( updateAppointment.patient, updateAppointment.physician, updateAppointment)

                return next()

                // return res.status(200).json({msg: 'Appointment accepted', appointment: updateAppointment})
            }else if (updateAppointment && updateAppointment.patient && status === 'denied'){

                req.pushNotificationData = {title: 'Appointment Denied', body: `Your appointment with Dr ${updateAppointment.physician?.last_name} ${updateAppointment.physician?.first_name} has been denied`, avatar: updateAppointment.physician?.avatar, messge: 'Appointment', data: updateAppointment}

                sendMailAppointmentDenied(updateAppointment.physician, updateAppointment.patient, appointment)

                return next()
                // return res.status(200).json({msg: 'Appointment denied', appointment: updateAppointment})
            }

        } catch (err: any) {
            console.log('Error while appointment is to be accepted:', err);
            return res.status(500).json({ error: `Error occurred while appointment is accepted: ${err.message}` });
        }
    }
    
    cancelAppointment = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        const {appointment_id, status} = req.body
        try {
            const user = req.account_holder.user
            const appointment = await prisma.appointment.findUnique({ where: {appointment_id} })
            
            if (appointment == null || !appointment) {
                return res.status(404).json({err: 'Appointment not found'})
            }
            
            if ((user.patient_id && user.patient_id !== appointment.patient_id) || (user.physician_id && user.physician_id !== appointment.physician_id)){
                return res.status(401).json({err: 'Appointment can only be cancelled by patient or physician for which the appointment is for'})
            }

            if (appointment.status === 'cancelled'){
                return res.status(409).json({err: 'Appointment already cancelled.'})
            }

            const cancelAppointment = await prisma.appointment.update({
                where: {appointment_id},
                data: {status},
                include: {patient: {
                    select: {last_name: true, email: true, first_name: true, gender: true, avatar: true}
                }, physician: {
                    select: {last_name: true, first_name: true, email: true, avatar: true }
                }}
            })

            const [patientNotification, physicianNotification] = await Promise.all([prisma.notification.create({
                data: {
                    appointment_id: cancelAppointment.appointment_id,
                    patient_id: cancelAppointment.patient_id,
                    physician_id: cancelAppointment.physician_id, 
                    notification_type: "Appointment",
                    notification_for_patient: true,
                    status: "completed",
                    case_note_id: null,
                    created_at: convertedDatetime(),
                    updated_at: convertedDatetime(),
                }
                }), prisma.notification.create({
                data: {
                    appointment_id: cancelAppointment.appointment_id,
                    patient_id: cancelAppointment.patient_id,
                    physician_id: cancelAppointment.physician_id, 
                    notification_type: "Appointment",
                    notification_for_physician: true,
                    status: "completed",
                    case_note_id: null,
                    created_at: convertedDatetime(),
                    updated_at: convertedDatetime(),
                }
            }) ])
            
            if (cancelAppointment && user.patient_id){
                // send a socket to the patient
                if (patientNotification){
                    io.emit(`notification-${cancelAppointment.patient_id}`, {
                        statusCode: 200,
                        notificationData: patientNotification,
                    })
                }

                req.pushNotificationData = {title: 'Appointment Cancellation', body: `Your patient ${cancelAppointment.patient?.last_name} ${cancelAppointment.patient?.first_name} has cancelled ${cancelAppointment.patient?.gender == "female"? "her": "his"} with you`, avatar: cancelAppointment.patient?.avatar, messge: 'Appointment', data: cancelAppointment}

                // send mail to the doctor and trigger notification
                sendMailAppointmentCancelledByPatient(cancelAppointment.physician, cancelAppointment.patient, appointment)

                return next()
                // return res.status(200).json({msg: 'Appointment cancelled', appointment: cancelAppointment})

            }else if (cancelAppointment && user.physician_id){
                //send socket event to physician
                if (physicianNotification){
                    io.emit(`notification-${cancelAppointment.patient_id}`, {
                        statusCode: 200,
                        notificationData: physicianNotification,
                    })
                }

                req.pushNotificationData = {title: 'Appointment Cancellation', body: `Your appointment with Dr ${cancelAppointment.physician?.last_name} ${cancelAppointment.physician?.first_name} has been cancelled`, avatar: cancelAppointment.physician?.avatar, messge: 'Appointment', data: cancelAppointment}
                // send mail to the patient and trigger notification for the patient
                sendMailAppointmentCancelled(cancelAppointment.physician, cancelAppointment.patient, appointment)
    
                // return res.status(200).json({msg: 'Appointment cancelled', appointment: cancelAppointment})
                return next()

            }


        } catch (err: any) {
            console.log('Error while appointment is to be accepted:', err);
            return res.status(500).json({ error: `Error occurred while appointment is accepted: ${err.message}` });
        }
    }
    
    filterAppointments = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.account_holder.user;
            const user_id = user.physician_id ? user.physician_id : (user.patient_id ? user.patient_id : null);
    
            const {status, page_number } = req.params;
            if (!status || status.trim() === ''){
                return res.status(400).json({err: 'Please provide appointment status'})
            }

            if ( !['pending', 'accepted', 'completed', 'denied'].includes(status)){
                return res.status(400).json({err: 'Invalid field for status'})
            }

            const [number_of_appointments, appointments] = await Promise.all([

                prisma.appointment.count({
                    where: {
                        patient_id: user.patient_id,
                        physician_id: user.physician_id,
                        status: { contains: status, mode: "insensitive" }
                    }
                }),
                
                prisma.appointment.findMany({
                    
                    skip: (Number(page_number) - 1) * 15,
    
                    take: 15,
                    
                    where: {
                        patient_id: user.patient_id,
                        physician_id: user.physician_id,
                        status: { contains: status, mode: "insensitive" }
                    },
                    include: {
                        patient: {
                            select:{
                                last_name: true, first_name: true, other_names: true, avatar: true, gender:true,
                            }
                        },
                        physician: {
                            select: {
                                last_name: true, first_name: true, other_names: true, avatar: true, gender: true, speciality: true, registered_as: true, bio:true, languages_spoken: true, 
                            }
                        }
                    },
    
                    orderBy: {
                        created_at: 'desc'
                    }
                    ,
    
                })

            ]);

            const number_of_pages = (number_of_appointments <= 15) ? 1 : Math.ceil(number_of_appointments/15)

            return res.status(200).json({message: "Appointments", data: {total_number_of_appointments: number_of_appointments, total_number_of_pages: number_of_pages, appointments: appointments} })
    
        } catch (err: any) {
            console.log('Error occurred during fetching all appointments:', err);
            return res.status(500).json({ error: `Error occurred while fetching all appointments: ${err.message}` });
        }
    }
    
    allAppointments = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.account_holder.user;

            const { page_number } = req.params;
            const [number_of_appointments, appointments] = await Promise.all([

                prisma.appointment.count({
                    where: {
                        patient_id: user.patient_id,
                        physician_id: user.physician_id
                    }
                }),

                prisma.appointment.findMany({

                    skip: (Number(page_number) - 1) * 15,
    
                    take: 15,
    
                    where: {
                        patient_id: user.patient_id,
                        physician_id: user.physician_id
                    },
                    include: {
                        patient: {
                            select:{
                                last_name: true, first_name: true, other_names: true, avatar: true, gender:true,
                            }
                        },
                        physician: {
                            select: {
                                last_name: true, first_name: true, other_names: true, avatar: true, gender: true, speciality: true, registered_as: true, bio:true, languages_spoken: true, 
                            }
                        }
                    },
    
                    orderBy: {
                        created_at: 'desc'
                    }
                    ,
    
                })

            ]);

            const number_of_pages = (number_of_appointments <= 15) ? 1 : Math.ceil(number_of_appointments/15)
            return res.status(200).json({message: "Appointments", data: {total_number_of_appointments: number_of_appointments, total_number_of_pages: number_of_pages, appointments: appointments} })
    
        } catch (err: any) {
            console.log('Error occurred during fetching all appointments:', err);
            return res.status(500).json({ error: `Error occurred while fetching all appointments: ${err.message}` });
        }
    }

    deleteAppointment = async (req: CustomRequest, res: Response, next: NextFunction) =>{
        try {
            const {appointment_id} = req.params

            const user = req.account_holder.user

            const appointment = await prisma.appointment.findUnique({
                where: {appointment_id}
            })

            if (!appointment) {
                return res.status(404).json({err: 'Appointment not found'})
            }

            if (appointment.patient_id !== user.patient_id){
                return res.status(401).json({err: 'You are not authorized to delete selected appointment.'})
            }

            const delete_appointment = await prisma.appointment.delete({
                where: {appointment_id}
            })
            // now we will delete all the chats linked to the appointment

            next()
        } catch (error: any) {
            console.log('Error occured while deleting appointment ', error)
            return res.status(500).json({err: 'Error occured while deleting appointment ', error})
        }
    }
}

export default new Appointment