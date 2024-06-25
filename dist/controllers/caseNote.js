"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const currrentDateTime_1 = __importDefault(require("../helpers/currrentDateTime"));
const index_1 = require("../index");
const prisma_1 = __importDefault(require("../helpers/prisma"));
class CaseNote {
    constructor() {
        this.allCaseNote = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { patient_id } = req.params;
            try {
                const user = req.account_holder.user;
                if (user.patient_id) {
                    return res.status(401).json({ err: 'Only doctors are authorized.' });
                }
                let physician_id = user.physician_id;
                const case_notes = yield prisma_1.default.case_note.findMany({
                    where: {
                        patient_id
                    }, include: {
                        physician: { select: { last_name: true, first_name: true, other_names: true, registered_as: true, speciality: true, avatar: true, } },
                    }
                });
                return res.status(200).json({ nbHit: case_notes.length, case_notes });
            }
            catch (error) {
                console.log(`Error occured while fetching all case notes err: `, error);
                return res.status(500).json({ error: `Something went wrong while fetching case notes.`, err: error });
            }
        });
        this.createCaseNote = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.account_holder.user;
                if (!user.physician_id || user.physician_id == null) {
                    return res.status(401).json({ err: 'Only doctors are allowed to create case note' });
                }
                const physician_id = user.physician_id;
                req.body.created_at = (0, currrentDateTime_1.default)();
                req.body.updated_at = (0, currrentDateTime_1.default)();
                const new_case_note = yield prisma_1.default.case_note.create({
                    data: Object.assign(Object.assign({}, req.body), { physician_id }),
                    include: {
                        patient: { select: { last_name: true, first_name: true, other_names: true, } },
                        physician: { select: { last_name: true, first_name: true, other_names: true, } },
                    }
                });
                const notification = yield prisma_1.default.notification.create({
                    data: {
                        appointment_id: null,
                        patient_id: req.body.patient_id,
                        physician_id: physician_id,
                        notification_type: "Case Note",
                        notification_for_physician: true,
                        status: "completed",
                        case_note_id: new_case_note.case_note_id,
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)(),
                    }
                });
                if (notification) {
                    index_1.io.emit(`notification-${physician_id}`, {
                        statusCode: 200,
                        notificationData: notification,
                    });
                }
                return res.status(201).json({ msg: 'New case note created', case_note: new_case_note });
            }
            catch (error) {
                console.log(`Error occured while creating case note err: `, error);
                return res.status(500).json({ error: `Something went wrong while creating case note`, err: error });
            }
        });
        // updateCaseNote = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        //     const {assessment_or_diagnosis, current_medication, examination_findings, family_history, history_of_presenting_complains,
        //         past_medical_history, past_medication, plan, presenting_complaint, review_of_system, social_history, } = req.body
        //     try {
        //         return res.status(401).json({err: "Feature has been suspend for now!"})
        //         const {case_note_id} = req.params
        //         // if (!case_note_id || case_note_id.trim() == ''){
        //         //     return res.status(400).json({err: 'Please provide the case_note_id.'})
        //         // }
        //         const user = req.account_holder.user
        //         if (!user.physician_id || user.physician_id == null){
        //             return res.status(401).json({err: 'Only doctors are allowed to update case note'})
        //         }
        //         const physician_id = user.physician_id
        //         const case_note = await prisma.case_note.findUnique({
        //             where: {case_note_id}
        //         })
        //         if (!case_note){
        //             return res.status(404).json({err: 'Incorrect case note id provided, might be deleted.'})
        //         }
        //         if (case_note?.physician_id !== physician_id){
        //             return res.status(401).json({err: 'You are not authorized to edit / modify the case note'})
        //         }   
        //         const update_case_note = await prisma.case_note.update({
        //             where: {case_note_id},
        //             data: {assessment_or_diagnosis, current_medication, examination_findings, family_history, history_of_presenting_complains,
        //                 past_medical_history, past_medication, plan, presenting_complaint, review_of_system, social_history, updated_at: convertedDatetime()}
        //         })            
        //         return res.status(200).json({msg: 'Case note updated successfully', case_note: update_case_note})
        //     } catch (error: any) {
        //         console.log('Error occured while updating the case note err: ',error)
        //         return res.status(500).json({error: `Something went wrong while updating the case note`, err: error})
        //     }
        // }
        // deleteCaseNote = async(req: CustomRequest, res: Response, next: NextFunction)=>{
        //     try {
        //         const {case_note_id} = req.params
        //         return res.status(401).json({err: "Feature has been suspend for now!"})
        //         return res.status(401).json({err: "Controller is closed atm."})
        //         const case_note_exist = await prisma.case_note.findUnique({
        //             where: {case_note_id}
        //         })
        //         if (!case_note_exist){
        //             return res.status(404).json({err: 'Case note not found.'})
        //         }
        //         const user = req.account_holder.user
        //         if (!user.physician_id || user.physician_id == null){
        //             return res.status(401).json({err: 'Only doctors are allowed to update case note'})
        //         }
        //         const physician_id = user.physician_id
        //         const case_note = await prisma.case_note.findUnique({
        //             where: {case_note_id}
        //         })
        //         if (case_note?.physician_id !== physician_id){
        //             return res.status(401).json({err: 'You are not authorized to edit/modify the case note'})
        //         }
        //             const delete_case_note = await prisma.case_note.delete({
        //                 where: {case_note_id}
        //             })
        //         return res.status(200).json({msg: 'Selected Case note deleted successfully'})
        //     } catch (error:any) {
        //         console.log('Error occured while deleting the selected case note err: ',error)
        //         return res.status(500).json({error: `Something went wrong while deleting the selected case note`, err: error})
        //     }
        // }
    }
}
exports.default = new CaseNote;
//# sourceMappingURL=caseNote.js.map