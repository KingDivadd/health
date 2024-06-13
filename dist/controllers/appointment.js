"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const email_1 = require("../helpers/email");
const currrentDateTime_1 = __importStar(require("../helpers/currrentDateTime"));
const prisma = new client_1.PrismaClient();
class Appointment {
    constructor() {
        this.createAppointment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const patient_id = req.account_holder.user.patient_id;
                req.body.patient_id = patient_id;
                req.body.created_at = Date.now();
                req.body.updated_at = Date.now();
                // Check if the appointment with the same patient_id already exists
                const existingAppointment = yield prisma.appointment.findFirst({
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
                const new_appointment_data = Object.assign(Object.assign({}, req.body), { time: req.body.time });
                const new_appointment = yield prisma.appointment.create({
                    data: req.body,
                    include: {
                        patient: {
                            select: { last_name: true, first_name: true, other_names: true, avatar: true }
                        },
                        physician: {
                            select: { last_name: true, first_name: true, other_names: true, avatar: true, bio: true, speciality: true, registered_as: true, languages_spoken: true, medical_license: true, gender: true, email: true }
                        }
                    }
                });
                if (new_appointment && new_appointment.physician) {
                    (0, email_1.sendMailBookingAppointment)(new_appointment.physician, new_appointment.patient, new_appointment);
                    // create notificaton
                    req.body.created_at = (0, currrentDateTime_1.default)();
                    req.body.updated_at = (0, currrentDateTime_1.default)();
                    const [] = yield Promise.all([prisma.notification.create({
                            data: {
                                appointment_id: new_appointment.appointment_id,
                                patient_id: new_appointment.patient_id,
                                physician_id: null,
                                title: "Appointment",
                                caseNote_id: null,
                                details: `You've created an appointment with Dr ${(_a = new_appointment.physician) === null || _a === void 0 ? void 0 : _a.last_name} ${(_b = new_appointment.physician) === null || _b === void 0 ? void 0 : _b.first_name} for ${(0, currrentDateTime_1.readableDate)(Number(new_appointment.time))}`,
                                created_at: (0, currrentDateTime_1.default)(),
                                updated_at: (0, currrentDateTime_1.default)(),
                            }
                        }), prisma.notification.create({
                            data: {
                                appointment_id: new_appointment.appointment_id,
                                patient_id: null,
                                physician_id: new_appointment.physician_id,
                                title: "Appointment",
                                caseNote_id: null,
                                details: `A new appointment has been created with you by ${(_c = new_appointment.patient) === null || _c === void 0 ? void 0 : _c.last_name} ${(_d = new_appointment.patient) === null || _d === void 0 ? void 0 : _d.first_name} for ${(0, currrentDateTime_1.readableDate)(Number(new_appointment.time))}.`,
                                created_at: (0, currrentDateTime_1.default)(),
                                updated_at: (0, currrentDateTime_1.default)(),
                            }
                        })]);
                }
                console.log(new_appointment.time, (0, currrentDateTime_1.readableDate)(Number(new_appointment.time)));
                return res.status(200).json({ msg: 'Appointment created successful', new_appointment });
            }
            catch (err) {
                console.log('Error occurred during appointment creation error:', err);
                return res.status(500).json({ error: `Error occurred during appointment creation: ${err.message}` });
            }
        });
        this.updateAppointment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _e, _f, _g, _h;
            const { appointment_id, status } = req.body;
            try {
                const user = req.account_holder.user;
                const appointment = yield prisma.appointment.findUnique({ where: { appointment_id } });
                if (appointment == null || !appointment) {
                    return res.status(404).json({ err: 'Appointment not found' });
                }
                if (!user.physician_id || user.physician_id !== appointment.physician_id) {
                    return res.status(401).json({ err: 'Only doctors booked for an appointment can accept or reject an appointment!' });
                }
                if (appointment.status === 'cancelled') {
                    return res.status(409).json({ err: 'Appointment already cancelled.' });
                }
                const updateAppointment = yield prisma.appointment.update({
                    where: { appointment_id },
                    data: { status },
                    include: { patient: {
                            select: { last_name: true, email: true, first_name: true }
                        }, physician: {
                            select: { last_name: true, first_name: true, email: true }
                        } }
                });
                if (updateAppointment && updateAppointment.patient && status === 'accepted') {
                    // send mail to the patient
                    const [] = yield Promise.all([prisma.notification.create({
                            data: {
                                appointment_id: updateAppointment.appointment_id,
                                patient_id: updateAppointment.patient_id,
                                physician_id: null,
                                title: "Appointment",
                                caseNote_id: null,
                                details: `Your appointment with Dr ${(_e = updateAppointment.physician) === null || _e === void 0 ? void 0 : _e.last_name} ${(_f = updateAppointment.physician) === null || _f === void 0 ? void 0 : _f.first_name} scheduled for ${(0, currrentDateTime_1.readableDate)(Number(updateAppointment.time))} has been accepted`,
                                created_at: (0, currrentDateTime_1.default)(),
                                updated_at: (0, currrentDateTime_1.default)(),
                            }
                        }), prisma.notification.create({
                            data: {
                                appointment_id: updateAppointment.appointment_id,
                                patient_id: null,
                                physician_id: updateAppointment.physician_id,
                                title: "Appointment",
                                caseNote_id: null,
                                details: `You've accepted the appointment created by ${(_g = updateAppointment.patient) === null || _g === void 0 ? void 0 : _g.last_name} ${(_h = updateAppointment.patient) === null || _h === void 0 ? void 0 : _h.first_name} scheduled for ${(0, currrentDateTime_1.readableDate)(Number(updateAppointment.time))}.`,
                                created_at: (0, currrentDateTime_1.default)(),
                                updated_at: (0, currrentDateTime_1.default)(),
                            }
                        })]);
                    (0, email_1.sendMailAcceptedAppointment)(updateAppointment.patient, updateAppointment.physician, updateAppointment);
                    return res.status(200).json({ msg: 'Appointment accepted', appointment: updateAppointment });
                }
                else if (updateAppointment && updateAppointment.patient && status === 'denied') {
                    (0, email_1.sendMailAppointmentDenied)(updateAppointment.physician, updateAppointment.patient, appointment);
                    return res.status(200).json({ msg: 'Appointment denied', appointment: updateAppointment });
                }
            }
            catch (err) {
                console.log('Error while appointment is to be accepted:', err);
                return res.status(500).json({ error: `Error occurred while appointment is accepted: ${err.message}` });
            }
        });
        this.cancelAppointment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _j, _k, _l, _m;
            const { appointment_id, status } = req.body;
            try {
                const user = req.account_holder.user;
                const appointment = yield prisma.appointment.findUnique({ where: { appointment_id } });
                if (appointment == null || !appointment) {
                    return res.status(404).json({ err: 'Appointment not found' });
                }
                if ((user.patient_id && user.patient_id !== appointment.patient_id) || (user.physician_id && user.physician_id !== appointment.physician_id)) {
                    return res.status(401).json({ err: 'Appointment can only be cancelled by patient or physician for which the appointment is for' });
                }
                if (appointment.status === 'cancelled') {
                    return res.status(409).json({ err: 'Appointment already cancelled.' });
                }
                const cancelAppointment = yield prisma.appointment.update({
                    where: { appointment_id },
                    data: { status },
                    include: { patient: {
                            select: { last_name: true, email: true, first_name: true }
                        }, physician: {
                            select: { last_name: true, first_name: true, email: true }
                        } }
                });
                const [] = yield Promise.all([prisma.notification.create({
                        data: {
                            appointment_id: cancelAppointment.appointment_id,
                            patient_id: cancelAppointment.patient_id,
                            physician_id: null,
                            title: "Appointment",
                            status: "completed",
                            caseNote_id: null,
                            details: `Your appointment with Dr ${(_j = cancelAppointment.physician) === null || _j === void 0 ? void 0 : _j.last_name} ${(_k = cancelAppointment.physician) === null || _k === void 0 ? void 0 : _k.first_name} scheduled for ${(0, currrentDateTime_1.readableDate)(Number(cancelAppointment.time))} has been cancelled`,
                            created_at: (0, currrentDateTime_1.default)(),
                            updated_at: (0, currrentDateTime_1.default)(),
                        }
                    }), prisma.notification.create({
                        data: {
                            appointment_id: cancelAppointment.appointment_id,
                            patient_id: null,
                            physician_id: cancelAppointment.physician_id,
                            title: "Appointment",
                            status: "completed",
                            caseNote_id: null,
                            details: `You've cancelld your appointment with ${(_l = cancelAppointment.patient) === null || _l === void 0 ? void 0 : _l.last_name} ${(_m = cancelAppointment.patient) === null || _m === void 0 ? void 0 : _m.first_name} scheduled for ${(0, currrentDateTime_1.readableDate)(Number(cancelAppointment.time))}.`,
                            created_at: (0, currrentDateTime_1.default)(),
                            updated_at: (0, currrentDateTime_1.default)(),
                        }
                    })]);
                if (cancelAppointment && user.patient_id) {
                    // send mail to the doctor and trigger notification
                    (0, email_1.sendMailAppointmentCancelledByPatient)(cancelAppointment.physician, cancelAppointment.patient, appointment);
                    return res.status(200).json({ msg: 'Appointment cancelled', appointment: cancelAppointment });
                }
                else if (cancelAppointment && user.physician_id) {
                    // send mail to the patient and trigger notification for the patient
                    (0, email_1.sendMailAppointmentCancelled)(cancelAppointment.physician, cancelAppointment.patient, appointment);
                    return res.status(200).json({ msg: 'Appointment cancelled', appointment: cancelAppointment });
                }
            }
            catch (err) {
                console.log('Error while appointment is to be accepted:', err);
                return res.status(500).json({ error: `Error occurred while appointment is accepted: ${err.message}` });
            }
        });
        this.filterAppointments = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.account_holder.user;
                const user_id = user.physician_id ? user.physician_id : (user.patient_id ? user.patient_id : null);
                const { status, page_number } = req.params;
                if (!status || status.trim() === '') {
                    return res.status(400).json({ err: 'Please provide appointment status' });
                }
                if (!['pending', 'accepted', 'completed', 'denied'].includes(status)) {
                    return res.status(400).json({ err: 'Invalid field for status' });
                }
                const [number_of_appointments, appointments] = yield Promise.all([
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
                                select: {
                                    last_name: true, first_name: true, other_names: true, avatar: true, gender: true,
                                }
                            },
                            physician: {
                                select: {
                                    last_name: true, first_name: true, other_names: true, avatar: true, gender: true, speciality: true, registered_as: true, bio: true, languages_spoken: true,
                                }
                            }
                        },
                        orderBy: {
                            created_at: 'desc'
                        },
                    })
                ]);
                const number_of_pages = (number_of_appointments <= 15) ? 1 : Math.ceil(number_of_appointments / 15);
                return res.status(200).json({ message: "Appointments", data: { total_number_of_appointments: number_of_appointments, total_number_of_pages: number_of_pages, appointments: appointments } });
            }
            catch (err) {
                console.log('Error occurred during fetching all appointments:', err);
                return res.status(500).json({ error: `Error occurred while fetching all appointments: ${err.message}` });
            }
        });
        this.allAppointments = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.account_holder.user;
                const { page_number } = req.params;
                const [number_of_appointments, appointments] = yield Promise.all([
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
                                select: {
                                    last_name: true, first_name: true, other_names: true, avatar: true, gender: true,
                                }
                            },
                            physician: {
                                select: {
                                    last_name: true, first_name: true, other_names: true, avatar: true, gender: true, speciality: true, registered_as: true, bio: true, languages_spoken: true,
                                }
                            }
                        },
                        orderBy: {
                            created_at: 'desc'
                        },
                    })
                ]);
                const number_of_pages = (number_of_appointments <= 15) ? 1 : Math.ceil(number_of_appointments / 15);
                return res.status(200).json({ message: "Appointments", data: { total_number_of_appointments: number_of_appointments, total_number_of_pages: number_of_pages, appointments: appointments } });
            }
            catch (err) {
                console.log('Error occurred during fetching all appointments:', err);
                return res.status(500).json({ error: `Error occurred while fetching all appointments: ${err.message}` });
            }
        });
        this.deleteAppointment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { appointment_id } = req.params;
                const user = req.account_holder.user;
                const appointment = yield prisma.appointment.findUnique({
                    where: { appointment_id }
                });
                if (!appointment) {
                    return res.status(404).json({ err: 'Appointment not found' });
                }
                if (appointment.patient_id !== user.patient_id) {
                    return res.status(401).json({ err: 'You are not authorized to delete selected appointment.' });
                }
                const delete_appointment = yield prisma.appointment.delete({
                    where: { appointment_id }
                });
                // now we will delete all the chats linked to the appointment
                next();
            }
            catch (error) {
                console.log('Error occured while deleting appointment ', error);
                return res.status(500).json({ err: 'Error occured while deleting appointment ', error });
            }
        });
    }
}
exports.default = new Appointment;
//# sourceMappingURL=appointment.js.map