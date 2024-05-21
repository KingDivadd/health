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
                    time: 'desc'
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
                time: req.body.time // Convert BigInt to string
            };
    
            const new_appointment = await prisma.appointment.create({
                data: new_appointment_data,
                include: {
                    patient: {
                        select: {last_name: true, first_name: true, other_names: true, avatar: true}
                    },
                    physician: {
                        select: {last_name:true, first_name: true, other_names: true, avatar: true, bio: true, speciality: true, registered_as: true, languages_spoken: true, medical_license: true, gender: true, }
                    }
                }
            });
    
    
            return res.status(200).json({msg: 'Appointment created successful', new_appointment });
        } catch (err: any) {
            console.log('Error occurred during appointment creation:', err);
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

            const updateAppointment = await prisma.appointment.update({
                where: {appointment_id},
                data: {status}
            })

            if (updateAppointment && status === 'accepted'){
                return res.status(200).json({msg: 'Appointment accepted', appointment: updateAppointment})
            }
            return res.status(200).json({msg: 'Appointment denied', appointment: updateAppointment})

        } catch (err: any) {
            console.log('Error while appointment is to be accepted:', err);
            return res.status(500).json({ error: `Error occurred while appointment is accepted: ${err.message}` });
        }
    }
    
    
    
    filterAppointments = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const {status} = req.body
        try {
            const user = req.account_holder.user;
            const user_id = user.physician_id ? user.physician_id : (user.patient_id ? user.patient_id : null);
    
            const { page_number } = req.params;
            const [number_of_appointments, appointments] = await Promise.all([

                prisma.appointment.count({
                    where: {
                        patient_id: user.patient_id,
                        physician_id: user.physician_id,
                        status: { contains: req.body.status, mode: "insensitive" }
                    }
                }),
                
                prisma.appointment.findMany({
                    
                    skip: (Number(page_number) - 1) * 15,
    
                    take: 15,
                    
                    where: {
                        patient_id: user.patient_id,
                        physician_id: user.physician_id,
                        status: { contains: req.body.status, mode: "insensitive" }
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

}

export default new Appointment