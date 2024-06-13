import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { CustomRequest } from '../helpers/interface';
import { sendMailAcceptedAppointment, sendMailAppointmentCancelled, sendMailAppointmentCancelledByPatient, sendMailAppointmentDenied, sendMailBookingAppointment } from '../helpers/email';
import convertedDatetime, {readableDate} from '../helpers/currrentDateTime';
const prisma = new PrismaClient()

class Appointment {
    createAppointment = async (req: CustomRequest, res: Response, next: NextFunction) => {
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
            const new_appointment_data = {
                ...req.body,
                time: req.body.time
            };
    
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

            if (new_appointment && new_appointment.physician){
                sendMailBookingAppointment(new_appointment.physician, new_appointment.patient, new_appointment)
                // create notificaton
                req.body.created_at= convertedDatetime()
                req.body.updated_at= convertedDatetime()
                
                const [] = await Promise.all([prisma.notification.create({
                    data: {
                        appointment_id: new_appointment.appointment_id,
                        patient_id: new_appointment.patient_id,
                        physician_id: null, 
                        title: "Appointment",
                        caseNote_id: null,
                        details: `You've created an appointment with Dr ${new_appointment.physician?.last_name} ${new_appointment.physician?.first_name} for ${readableDate(Number(new_appointment.time))}`,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                }),prisma.notification.create({
                    data: {
                        appointment_id: new_appointment.appointment_id,
                        patient_id: null,
                        physician_id: new_appointment.physician_id, 
                        title: "Appointment",
                        caseNote_id: null,
                        details: `A new appointment has been created with you by ${new_appointment.patient?.last_name} ${new_appointment.patient?.first_name} for ${readableDate(Number(new_appointment.time))}.`,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                }) ])

            }
    
    
            console.log(new_appointment.time, readableDate(Number(new_appointment.time)))
            return res.status(200).json({msg: 'Appointment created successful', new_appointment });
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
                    select: {last_name: true, email: true, first_name: true}
                }, physician: {
                    select: {last_name: true, first_name: true, email: true }
                }}
            })

            if (updateAppointment && updateAppointment.patient && status === 'accepted'){
                // send mail to the patient
                const [] = await Promise.all([prisma.notification.create({
                    data: {
                        appointment_id: updateAppointment.appointment_id,
                        patient_id: updateAppointment.patient_id,
                        physician_id: null, 
                        title: "Appointment",
                        caseNote_id: null,
                        details: `Your appointment with Dr ${updateAppointment.physician?.last_name} ${updateAppointment.physician?.first_name} scheduled for ${readableDate(Number(updateAppointment.time))} has been accepted`,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                    }),prisma.notification.create({
                    data: {
                        appointment_id: updateAppointment.appointment_id,
                        patient_id: null,
                        physician_id: updateAppointment.physician_id, 
                        title: "Appointment",
                        caseNote_id: null,
                        details: `You've accepted the appointment created by ${updateAppointment.patient?.last_name} ${updateAppointment.patient?.first_name} scheduled for ${readableDate(Number(updateAppointment.time))}.`,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                }) ])
                sendMailAcceptedAppointment( updateAppointment.patient, updateAppointment.physician, updateAppointment)

                return res.status(200).json({msg: 'Appointment accepted', appointment: updateAppointment})
            }else if (updateAppointment && updateAppointment.patient && status === 'denied'){

                sendMailAppointmentDenied(updateAppointment.physician, updateAppointment.patient, appointment)

                return res.status(200).json({msg: 'Appointment denied', appointment: updateAppointment})
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
                    select: {last_name: true, email: true, first_name: true}
                }, physician: {
                    select: {last_name: true, first_name: true, email: true }
                }}
            })

            const [] = await Promise.all([prisma.notification.create({
                data: {
                    appointment_id: cancelAppointment.appointment_id,
                    patient_id: cancelAppointment.patient_id,
                    physician_id: null, 
                    title: "Appointment",
                    status: "completed",
                    caseNote_id: null,
                    details: `Your appointment with Dr ${cancelAppointment.physician?.last_name} ${cancelAppointment.physician?.first_name} scheduled for ${readableDate(Number(cancelAppointment.time))} has been cancelled`,
                    created_at: convertedDatetime(),
                    updated_at: convertedDatetime(),
                }
                }),prisma.notification.create({
                data: {
                    appointment_id: cancelAppointment.appointment_id,
                    patient_id: null,
                    physician_id: cancelAppointment.physician_id, 
                    title: "Appointment",
                    status: "completed",
                    caseNote_id: null,
                    details: `You've cancelld your appointment with ${cancelAppointment.patient?.last_name} ${cancelAppointment.patient?.first_name} scheduled for ${readableDate(Number(cancelAppointment.time))}.`,
                    created_at: convertedDatetime(),
                    updated_at: convertedDatetime(),
                }
            }) ])
            
            if (cancelAppointment && user.patient_id){
                // send mail to the doctor and trigger notification
                sendMailAppointmentCancelledByPatient(cancelAppointment.physician, cancelAppointment.patient, appointment)

                return res.status(200).json({msg: 'Appointment cancelled', appointment: cancelAppointment})

            }else if (cancelAppointment && user.physician_id){
                // send mail to the patient and trigger notification for the patient
                sendMailAppointmentCancelled(cancelAppointment.physician, cancelAppointment.patient, appointment)
    
                return res.status(200).json({msg: 'Appointment cancelled', appointment: cancelAppointment})

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