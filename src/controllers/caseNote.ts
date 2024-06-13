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

class CaseNote {

    allCaseNote = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        const {patient_id} = req.params
        try {
            const user = req.account_holder.user;

            if(user.patient_id){
                return res.status(401).json({err: 'Only doctors are authorized.'})
            }

            let physician_id = user.physician_id

            const case_notes = await prisma.caseNote.findMany({
                where: {
                    patient_id
                },include: {
                    physician: {select: {last_name: true, first_name: true, other_names: true, registered_as: true, speciality: true, avatar: true, }},
                }
            })

            return res.status(200).json({nbHit: case_notes.length, case_notes})

        } catch (error: any) {
            console.log(`Error occured while fetching all case notes err: `,error)
            return res.status(500).json({error: `Something went wrong while fetching case notes.`, err: error})
        }
    }

    createCaseNote = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        
        try {
            const user = req.account_holder.user
            if (!user.physician_id || user.physician_id == null){
                return res.status(401).json({err: 'Only doctors are allowed to create case note'})
            }
            const physician_id = user.physician_id

            req.body.created_at= convertedDatetime()
            req.body.updated_at= convertedDatetime()

            const new_case_note = await prisma.caseNote.create({
                data: {...req.body, physician_id},
                include:{
                    patient: {select: {last_name: true, first_name: true, other_names: true, }},
                    physician: {select: {last_name: true, first_name: true, other_names: true, }},
                }
            })

            const notification = await prisma.notification.create({
                data: {
                    appointment_id: null,
                    patient_id: req.body.patient_id,
                    physician_id: physician_id, 
                    title: "Case Note",
                    status: "completed",
                    caseNote_id: new_case_note.caseNote_id,
                    details: `You've added a new case note for ${new_case_note.patient?.last_name} ${new_case_note.patient?.first_name}.`,
                    created_at: convertedDatetime(),
                    updated_at: convertedDatetime(),
                }
            })

            return res.status(201).json({msg: 'New case note created', case_note: new_case_note})
        } catch (error: any) {
            console.log(`Error occured while creating case note err: `,error)
            return res.status(500).json({error: `Something went wrong while creating case note`, err: error})
        }
    }
    
    updateCaseNote = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        const {assessment_or_diagnosis, current_medication, examination_findings, family_history, history_of_presenting_complains,
            past_medical_history, past_medication, plan, presenting_complaint, review_of_system, social_history, } = req.body

        try {
            return res.status(401).json({err: "Feature has been suspend for now!"})
            const {caseNote_id} = req.params
            
            
            // if (!caseNote_id || caseNote_id.trim() == ''){
            //     return res.status(400).json({err: 'Please provide the caseNote_id.'})
            // }
            const user = req.account_holder.user

            if (!user.physician_id || user.physician_id == null){
                return res.status(401).json({err: 'Only doctors are allowed to update case note'})
            }

            const physician_id = user.physician_id

            const case_note = await prisma.caseNote.findUnique({
                where: {caseNote_id}
            })

            if (!case_note){
                return res.status(404).json({err: 'Incorrect case note id provided, might be deleted.'})
            }

            if (case_note?.physician_id !== physician_id){
                return res.status(401).json({err: 'You are not authorized to edit / modify the case note'})
            }   

            const update_case_note = await prisma.caseNote.update({

                where: {caseNote_id},
                data: {assessment_or_diagnosis, current_medication, examination_findings, family_history, history_of_presenting_complains,
                    past_medical_history, past_medication, plan, presenting_complaint, review_of_system, social_history, updated_at: convertedDatetime()}

            })            

            return res.status(200).json({msg: 'Case note updated successfully', case_note: update_case_note})
        } catch (error: any) {
            console.log('Error occured while updating the case note err: ',error)
            return res.status(500).json({error: `Something went wrong while updating the case note`, err: error})
            
        }
    }
    
    deleteCaseNote = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        try {
            const {caseNote_id} = req.params

            return res.status(401).json({err: "Feature has been suspend for now!"})

            return res.status(401).json({err: "Controller is closed atm."})
            const case_note_exist = await prisma.caseNote.findUnique({
                where: {caseNote_id}
            })

            if (!case_note_exist){
                return res.status(404).json({err: 'Case note not found.'})
            }

            const user = req.account_holder.user

            if (!user.physician_id || user.physician_id == null){
                return res.status(401).json({err: 'Only doctors are allowed to update case note'})
            }

            const physician_id = user.physician_id

            const case_note = await prisma.caseNote.findUnique({
                where: {caseNote_id}
            })

            if (case_note?.physician_id !== physician_id){
                return res.status(401).json({err: 'You are not authorized to edit/modify the case note'})
            }

                const delete_case_note = await prisma.caseNote.delete({
                    where: {caseNote_id}
                })

            return res.status(200).json({msg: 'Selected Case note deleted successfully'})
        } catch (error:any) {
            console.log('Error occured while deleting the selected case note err: ',error)
            return res.status(500).json({error: `Something went wrong while deleting the selected case note`, err: error})
        }
    }
}

export default new CaseNote