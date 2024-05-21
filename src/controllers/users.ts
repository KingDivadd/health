import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import redisFunc from '../helpers/redisFunc';
import { CustomRequest } from '../helpers/interface';
import convertedDatetime from '../helpers/currrentDateTime';
const prisma = new PrismaClient()

const { redisValueUpdate } = redisFunc

class Users {
    loggedInPatient = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.account_holder.user

            const fetched_user = await prisma.patient.findUnique({
                where: {patient_id: user.patient_id}
            })

            const auth_id = req.headers['x-id-key'];

            res.setHeader('x-id-key', auth_id)
            return res.status(200).json({ logged_in_user: user })
        } catch (err) {
            console.log('Error while fetching user data ', err)
            return res.status(500).json({ err: 'Internal server error while signing in patient', error: err })
        }
    }
    loggedInPhysician = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.account_holder.user

            const fetched_user = await prisma.physician.findUnique({
                where: {physician_id: user.physician_id}
            })

            const auth_id = req.headers['x-id-key'];

            res.setHeader('x-id-key', auth_id)
            return res.status(200).json({ logged_in_user: user })
        } catch (err) {
            console.log('Error while fetching user data ', err)
            return res.status(500).json({ err: 'Internal server error while signing in physician', error: err })
        }
    }

    signupUpdatePatientData = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const {date_of_birth, country_code, phone_number} = req.body
        try {
            if (req.body.date_of_birth){
                req.body.date_of_birth = convertedDatetime(date_of_birth)
            }
            req.body.updated_at = convertedDatetime(); 
            const patient_id = req.account_holder.user.patient_id;

            const user: any = await prisma.patient.update({
                where: {
                    patient_id
                },
                data: req.body 
            });
            req.user_email = req.account_holder.user.email;
            if (user.phone_number && user.country_code) {
                req.phone_number = user.country_code + user.phone_number;
            }
    
            return next();
        } catch (err) {
            console.log('Error during patient profile update or edit ', err);
            return res.status(500).json({ err: 'Internal server error during patient profile update', error: err });
        }
    }
    

    editPatientData = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const {date_of_birth, country_code, phone_number} = req.body
        const auth_id = req.headers['x-id-key'];

        try {
            req.body.date_of_birth = convertedDatetime(date_of_birth)
            req.body.updated_at = convertedDatetime(); 
            const patient_id = req.account_holder.user.patient_id
            const updated_patient_data = await prisma.patient.update({
                where: {
                    patient_id
                },
                data: req.body
            })

            const new_auth_id:any = await redisValueUpdate(auth_id, updated_patient_data, 60 * 60 * 23);

            res.setHeader('x-id-key', new_auth_id)

            return res.status(200).json({ msg: 'Profile updated successfully', user: new_auth_id})
        } catch (err) {
            console.log('Error during patient profile update or edit ', err)
            return res.status(500).json({ err: 'Internal server error during patient data update', error: err })
        }
    }

    singupUpdatePhysicianData = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const {date_of_birth, country_code, phone_number} = req.body
        try {
            req.body.date_of_birth = convertedDatetime(date_of_birth)
            req.body.updated_at = convertedDatetime(); 
            const physician_id = req.account_holder.user.physician_id
            const user:any = await prisma.physician.update({
                where: {
                    physician_id
                },
                data: req.body
            })
            req.user_email = req.account_holder.user.email
            if (user.phone_number && user.country_code){
                req.phone_number = user.country_code + user.phone_number
            }

            return next()
        } catch (err) {
            console.log('Error during patient profile update or edit ', err)
            return res.status(500).json({ err: 'Internal server error' })
        }
    }

    editPhysicianData = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const {date_of_birth, phone_number, country_code} = req.body

        try {
            const auth_id = req.headers['x-id-key'];

            req.body.date_of_birth = convertedDatetime(date_of_birth)
            req.body.updated_at = convertedDatetime(); 
            const physician_id = req.account_holder.user.physician_id
            const updated_physician_data = await prisma.physician.update({
                where: {
                    physician_id
                },
                data: req.body
            })
            
            const new_auth_id:any = await redisValueUpdate(auth_id, updated_physician_data, 60 * 60 * 12);

            res.setHeader('x-id-key', new_auth_id)

            return res.status(200).json({ msg: 'Profile updated successfully', user: updated_physician_data})
            
        } catch (err) {
            console.log('Error during patient profile update or edit ', err)
            return res.status(500).json({ err: 'Internal server error' })
        }
    }

    allPhysicians = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const {page_number} = req.params
        try {

            const [number_of_physicians, physicians] = await Promise.all([
                prisma.physician.count({}),

                prisma.physician.findMany({

                    skip: (Number(page_number) - 1) * 15,

                    take: 15,

                    orderBy: {
                        created_at: 'desc'
                    }
                    
                })
            ])

            const number_of_pages = (number_of_physicians <= 15) ? 1 : Math.ceil(number_of_physicians/15)

            return res.status(200).json({ message:'Physicians', data: {total_number_of_physicians: number_of_physicians, total_number_of_pages: number_of_pages, physicians: physicians} })
        } catch (err: any) {
            console.error('Error fetching all physicians ', err)
            return res.status(500).json({ err: 'Internal server err' })
        }
    }

    filterPhysicians = async (req: Request, res: Response, next: NextFunction) => {
        const { name, registered_as, speciality } = req.body
        const {page_number} = req.params
        try {

            const [number_of_physicians, physicians] = await Promise.all([
                prisma.physician.count({
                    where: {
                        OR: [
                            { last_name: { contains: name, mode: "insensitive" } },
                            { first_name: { contains: name, mode: "insensitive" } },
                            { other_names: { contains: name, mode: "insensitive" } }
                        ],
                        registered_as: { contains: registered_as, mode: "insensitive" },
                        speciality: { contains: speciality, mode: "insensitive" }
                    }
                }),

                prisma.physician.findMany({
                    where: {
                        OR: [
                            { last_name: { contains: name, mode: "insensitive" } },
                            { first_name: { contains: name, mode: "insensitive" } },
                            { other_names: { contains: name, mode: "insensitive" } }
                        ],
                    },

                    skip: (Number(page_number) - 1) * 15,

                    take: 15,

                    orderBy: {
                        created_at: 'desc'
                    }
                    
                })
            ])

            const number_of_pages = (number_of_physicians <= 15) ? 1 : Math.ceil(number_of_physicians/15)


            return res.status(200).json({ message:'Physicians', data: {total_number_of_physicians: number_of_physicians, total_number_of_pages: number_of_pages, physicians: physicians} })
        } catch (err: any) {
            console.error('Error fetching all physicians ', err)
            return res.status(500).json({ err: 'Internal server err' })
        }
    }

}

export default new Users