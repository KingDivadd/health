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
const client_1 = require("@prisma/client");
const currrentDateTime_1 = __importDefault(require("../helpers/currrentDateTime"));
const { Decimal } = require('decimal.js');
const bcrypt = require('bcrypt');
const prisma = new client_1.PrismaClient();
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
                const case_notes = yield prisma.caseNote.findMany({
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
            var _a, _b;
            try {
                const user = req.account_holder.user;
                if (!user.physician_id || user.physician_id == null) {
                    return res.status(401).json({ err: 'Only doctors are allowed to create case note' });
                }
                const physician_id = user.physician_id;
                req.body.created_at = (0, currrentDateTime_1.default)();
                req.body.updated_at = (0, currrentDateTime_1.default)();
                const new_case_note = yield prisma.caseNote.create({
                    data: Object.assign(Object.assign({}, req.body), { physician_id }),
                    include: {
                        patient: { select: { last_name: true, first_name: true, other_names: true, } },
                        physician: { select: { last_name: true, first_name: true, other_names: true, } },
                    }
                });
                const notification = yield prisma.notification.create({
                    data: {
                        appointment_id: null,
                        patient_id: req.body.patient_id,
                        physician_id: physician_id,
                        title: "Case Note",
                        caseNote_id: new_case_note.caseNote_id,
                        details: `You've added a new case note for ${(_a = new_case_note.patient) === null || _a === void 0 ? void 0 : _a.last_name} ${(_b = new_case_note.patient) === null || _b === void 0 ? void 0 : _b.first_name}.`,
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)(),
                    }
                });
                return res.status(201).json({ msg: 'New case note created', case_note: new_case_note });
            }
            catch (error) {
                console.log(`Error occured while creating case note err: `, error);
                return res.status(500).json({ error: `Something went wrong while creating case note`, err: error });
            }
        });
        this.updateCaseNote = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { assessment_or_diagnosis, current_medication, examination_findings, family_history, history_of_presenting_complains, past_medical_history, past_medication, plan, presenting_complaint, review_of_system, social_history, } = req.body;
            try {
                const { caseNote_id } = req.params;
                if (!caseNote_id || caseNote_id.trim() == '') {
                    return res.status(400).json({ err: 'Please provide the caseNote_id.' });
                }
                const user = req.account_holder.user;
                if (!user.physician_id || user.physician_id == null) {
                    return res.status(401).json({ err: 'Only doctors are allowed to update case note' });
                }
                const physician_id = user.physician_id;
                const case_note = yield prisma.caseNote.findUnique({
                    where: { caseNote_id }
                });
                if (!case_note) {
                    return res.status(404).json({ err: 'Incorrect case note id provided, might be deleted.' });
                }
                if ((case_note === null || case_note === void 0 ? void 0 : case_note.physician_id) !== physician_id) {
                    return res.status(401).json({ err: 'You are not authorized to edit / modify the case note' });
                }
                const update_case_note = yield prisma.caseNote.update({
                    where: { caseNote_id },
                    data: { assessment_or_diagnosis, current_medication, examination_findings, family_history, history_of_presenting_complains,
                        past_medical_history, past_medication, plan, presenting_complaint, review_of_system, social_history, updated_at: (0, currrentDateTime_1.default)() }
                });
                return res.status(200).json({ msg: 'Case note updated successfully', case_note: update_case_note });
            }
            catch (error) {
                console.log('Error occured while updating the case note err: ', error);
                return res.status(500).json({ error: `Something went wrong while updating the case note`, err: error });
            }
        });
        this.deleteCaseNote = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { caseNote_id } = req.params;
                return res.status(401).json({ err: "Controller is closed atm." });
                const case_note_exist = yield prisma.caseNote.findUnique({
                    where: { caseNote_id }
                });
                if (!case_note_exist) {
                    return res.status(404).json({ err: 'Case note not found.' });
                }
                const user = req.account_holder.user;
                if (!user.physician_id || user.physician_id == null) {
                    return res.status(401).json({ err: 'Only doctors are allowed to update case note' });
                }
                const physician_id = user.physician_id;
                const case_note = yield prisma.caseNote.findUnique({
                    where: { caseNote_id }
                });
                if ((case_note === null || case_note === void 0 ? void 0 : case_note.physician_id) !== physician_id) {
                    return res.status(401).json({ err: 'You are not authorized to edit/modify the case note' });
                }
                const delete_case_note = yield prisma.caseNote.delete({
                    where: { caseNote_id }
                });
                return res.status(200).json({ msg: 'Selected Case note deleted successfully' });
            }
            catch (error) {
                console.log('Error occured while deleting the selected case note err: ', error);
                return res.status(500).json({ error: `Something went wrong while deleting the selected case note`, err: error });
            }
        });
    }
}
exports.default = new CaseNote;
//# sourceMappingURL=caseNote.js.map