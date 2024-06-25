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
const email_1 = require("../helpers/email");
const currrentDateTime_1 = __importDefault(require("../helpers/currrentDateTime"));
const index_1 = require("../index");
const prisma_1 = __importDefault(require("../helpers/prisma"));
const constants_1 = require("../helpers/constants");
const axios_1 = __importDefault(require("axios"));
const jwt = require('jsonwebtoken');
class Appointment {
    constructor() {
        this.bookAppointment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const patient_id = req.account_holder.user.patient_id;
                req.body.patient_id = patient_id;
                req.body.created_at = Date.now();
                req.body.updated_at = Date.now();
                // Check if the appointment with the same patient_id already exists
                const existingAppointment = yield prisma_1.default.appointment.findFirst({
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
                    apikey: constants_1.videosdk_api_key,
                    permissions: ["allow_join", "allow_mod"],
                };
                const token = jwt.sign(payload, constants_1.videosdk_secret_key, options);
                // create meeting
                const response = yield axios_1.default.post(`${constants_1.videosdk_endpoint}/v2/rooms`, {}, {
                    headers: {
                        Authorization: token,
                    }
                });
                const meeting_id = response.data.roomId;
                req.body.meeting_id = meeting_id;
                const new_appointment = yield prisma_1.default.appointment.create({
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
                if (new_appointment) {
                    (0, email_1.sendMailBookingAppointment)(new_appointment.physician, new_appointment.patient, new_appointment);
                    // create notificaton
                    req.body.created_at = (0, currrentDateTime_1.default)();
                    req.body.updated_at = (0, currrentDateTime_1.default)();
                    const [patientNotification, physicianNotification] = yield Promise.all([prisma_1.default.notification.create({
                            data: {
                                appointment_id: new_appointment.appointment_id,
                                patient_id: new_appointment.patient_id,
                                physician_id: new_appointment.physician_id,
                                case_note_id: null,
                                notification_type: "Appointment",
                                notification_for_patient: true,
                                created_at: (0, currrentDateTime_1.default)(),
                                updated_at: (0, currrentDateTime_1.default)(),
                            }
                        }), prisma_1.default.notification.create({
                            data: {
                                appointment_id: new_appointment.appointment_id,
                                patient_id: new_appointment.patient_id,
                                physician_id: new_appointment.physician_id,
                                case_note_id: null,
                                notification_type: "Appointment",
                                notification_for_physician: true,
                                created_at: (0, currrentDateTime_1.default)(),
                                updated_at: (0, currrentDateTime_1.default)(),
                            }
                        })]);
                    // send a socket to both patient and physician
                    if (patientNotification) {
                        index_1.io.emit(`notification-${new_appointment.patient_id}`, {
                            statusCode: 200,
                            notificationData: patientNotification,
                        });
                    }
                    if (physicianNotification) {
                        index_1.io.emit(`notification-${new_appointment.physician_id}`, {
                            statusCode: 200,
                            notificationData: patientNotification,
                        });
                    }
                    req.pushNotificationData = { title: 'New Appointment Booking', body: `${(_a = new_appointment.patient) === null || _a === void 0 ? void 0 : _a.last_name} ${(_b = new_appointment.patient) === null || _b === void 0 ? void 0 : _b.first_name} has booked an appointment with you`, avatar: (_c = new_appointment.patient) === null || _c === void 0 ? void 0 : _c.avatar, messge: 'Appointment Created', data: new_appointment };
                    return next();
                }
            }
            catch (err) {
                console.log('Error occurred during appointment creation error:', err);
                return res.status(500).json({ error: `Error occurred during appointment creation: ${err.message}` });
            }
        });
        this.updateAppointment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _d, _e, _f, _g, _h, _j;
            const { appointment_id, status } = req.body;
            try {
                const user = req.account_holder.user;
                const appointment = yield prisma_1.default.appointment.findUnique({ where: { appointment_id } });
                if (appointment == null || !appointment) {
                    return res.status(404).json({ err: 'Appointment not found' });
                }
                if (!user.physician_id || user.physician_id !== appointment.physician_id) {
                    return res.status(401).json({ err: 'Only doctors booked for an appointment can accept or reject an appointment!' });
                }
                if (appointment.status === 'cancelled') {
                    return res.status(409).json({ err: 'Appointment already cancelled.' });
                }
                const updateAppointment = yield prisma_1.default.appointment.update({
                    where: { appointment_id },
                    data: { status },
                    include: { patient: {
                            select: { last_name: true, email: true, first_name: true, avatar: true }
                        }, physician: {
                            select: { last_name: true, first_name: true, email: true, avatar: true }
                        } }
                });
                if (updateAppointment && updateAppointment.patient && status === 'accepted') {
                    // send mail to the patient
                    const [patientNotification, physicianNotification] = yield Promise.all([prisma_1.default.notification.create({
                            data: {
                                notification_type: "Appointment",
                                notification_for_patient: true,
                                appointment_id: updateAppointment.appointment_id,
                                patient_id: updateAppointment.patient_id,
                                physician_id: updateAppointment.patient_id,
                                case_note_id: null,
                                created_at: (0, currrentDateTime_1.default)(),
                                updated_at: (0, currrentDateTime_1.default)(),
                            }
                        }), prisma_1.default.notification.create({
                            data: {
                                notification_type: "Appointment",
                                notification_for_physician: true,
                                appointment_id: updateAppointment.appointment_id,
                                patient_id: updateAppointment.patient_id,
                                physician_id: updateAppointment.physician_id,
                                case_note_id: null,
                                created_at: (0, currrentDateTime_1.default)(),
                                updated_at: (0, currrentDateTime_1.default)(),
                            }
                        })]);
                    if (patientNotification) {
                        console.log('patient notification ', patientNotification);
                        index_1.io.emit(`notification-${updateAppointment.patient_id}`, {
                            statusCode: 200,
                            notificationData: patientNotification,
                        });
                    }
                    if (physicianNotification) {
                        console.log('physician notification ', physicianNotification);
                        index_1.io.emit(`notification-${updateAppointment.physician_id}`, {
                            statusCode: 200,
                            notificationData: physicianNotification,
                        });
                    }
                    req.pushNotificationData = { title: 'Appointment Update', body: `Dr ${(_d = updateAppointment.physician) === null || _d === void 0 ? void 0 : _d.last_name} ${(_e = updateAppointment.physician) === null || _e === void 0 ? void 0 : _e.first_name} has accepted your appointment`, avatar: (_f = updateAppointment.physician) === null || _f === void 0 ? void 0 : _f.avatar, messge: 'Appointment', data: updateAppointment };
                    (0, email_1.sendMailAcceptedAppointment)(updateAppointment.patient, updateAppointment.physician, updateAppointment);
                    return next();
                    // return res.status(200).json({msg: 'Appointment accepted', appointment: updateAppointment})
                }
                else if (updateAppointment && updateAppointment.patient && status === 'denied') {
                    req.pushNotificationData = { title: 'Appointment Denied', body: `Your appointment with Dr ${(_g = updateAppointment.physician) === null || _g === void 0 ? void 0 : _g.last_name} ${(_h = updateAppointment.physician) === null || _h === void 0 ? void 0 : _h.first_name} has been denied`, avatar: (_j = updateAppointment.physician) === null || _j === void 0 ? void 0 : _j.avatar, messge: 'Appointment', data: updateAppointment };
                    (0, email_1.sendMailAppointmentDenied)(updateAppointment.physician, updateAppointment.patient, appointment);
                    return next();
                    // return res.status(200).json({msg: 'Appointment denied', appointment: updateAppointment})
                }
            }
            catch (err) {
                console.log('Error while appointment is to be accepted:', err);
                return res.status(500).json({ error: `Error occurred while appointment is accepted: ${err.message}` });
            }
        });
        this.cancelAppointment = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _k, _l, _m, _o, _p, _q, _r;
            const { appointment_id, status } = req.body;
            try {
                const user = req.account_holder.user;
                const appointment = yield prisma_1.default.appointment.findUnique({ where: { appointment_id } });
                if (appointment == null || !appointment) {
                    return res.status(404).json({ err: 'Appointment not found' });
                }
                if ((user.patient_id && user.patient_id !== appointment.patient_id) || (user.physician_id && user.physician_id !== appointment.physician_id)) {
                    return res.status(401).json({ err: 'Appointment can only be cancelled by patient or physician for which the appointment is for' });
                }
                if (appointment.status === 'cancelled') {
                    return res.status(409).json({ err: 'Appointment already cancelled.' });
                }
                const cancelAppointment = yield prisma_1.default.appointment.update({
                    where: { appointment_id },
                    data: { status },
                    include: { patient: {
                            select: { last_name: true, email: true, first_name: true, gender: true, avatar: true }
                        }, physician: {
                            select: { last_name: true, first_name: true, email: true, avatar: true }
                        } }
                });
                const [patientNotification, physicianNotification] = yield Promise.all([prisma_1.default.notification.create({
                        data: {
                            appointment_id: cancelAppointment.appointment_id,
                            patient_id: cancelAppointment.patient_id,
                            physician_id: cancelAppointment.physician_id,
                            notification_type: "Appointment",
                            notification_for_patient: true,
                            status: "completed",
                            case_note_id: null,
                            created_at: (0, currrentDateTime_1.default)(),
                            updated_at: (0, currrentDateTime_1.default)(),
                        }
                    }), prisma_1.default.notification.create({
                        data: {
                            appointment_id: cancelAppointment.appointment_id,
                            patient_id: cancelAppointment.patient_id,
                            physician_id: cancelAppointment.physician_id,
                            notification_type: "Appointment",
                            notification_for_physician: true,
                            status: "completed",
                            case_note_id: null,
                            created_at: (0, currrentDateTime_1.default)(),
                            updated_at: (0, currrentDateTime_1.default)(),
                        }
                    })]);
                if (cancelAppointment && user.patient_id) {
                    // send a socket to the patient
                    if (patientNotification) {
                        index_1.io.emit(`notification-${cancelAppointment.patient_id}`, {
                            statusCode: 200,
                            notificationData: patientNotification,
                        });
                    }
                    req.pushNotificationData = { title: 'Appointment Cancellation', body: `Your patient ${(_k = cancelAppointment.patient) === null || _k === void 0 ? void 0 : _k.last_name} ${(_l = cancelAppointment.patient) === null || _l === void 0 ? void 0 : _l.first_name} has cancelled ${((_m = cancelAppointment.patient) === null || _m === void 0 ? void 0 : _m.gender) == "female" ? "her" : "his"} with you`, avatar: (_o = cancelAppointment.patient) === null || _o === void 0 ? void 0 : _o.avatar, messge: 'Appointment', data: cancelAppointment };
                    // send mail to the doctor and trigger notification
                    (0, email_1.sendMailAppointmentCancelledByPatient)(cancelAppointment.physician, cancelAppointment.patient, appointment);
                    return next();
                    // return res.status(200).json({msg: 'Appointment cancelled', appointment: cancelAppointment})
                }
                else if (cancelAppointment && user.physician_id) {
                    //send socket event to physician
                    if (physicianNotification) {
                        index_1.io.emit(`notification-${cancelAppointment.patient_id}`, {
                            statusCode: 200,
                            notificationData: physicianNotification,
                        });
                    }
                    req.pushNotificationData = { title: 'Appointment Cancellation', body: `Your appointment with Dr ${(_p = cancelAppointment.physician) === null || _p === void 0 ? void 0 : _p.last_name} ${(_q = cancelAppointment.physician) === null || _q === void 0 ? void 0 : _q.first_name} has been cancelled`, avatar: (_r = cancelAppointment.physician) === null || _r === void 0 ? void 0 : _r.avatar, messge: 'Appointment', data: cancelAppointment };
                    // send mail to the patient and trigger notification for the patient
                    (0, email_1.sendMailAppointmentCancelled)(cancelAppointment.physician, cancelAppointment.patient, appointment);
                    // return res.status(200).json({msg: 'Appointment cancelled', appointment: cancelAppointment})
                    return next();
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
                    prisma_1.default.appointment.count({
                        where: {
                            patient_id: user.patient_id,
                            physician_id: user.physician_id,
                            status: { contains: status, mode: "insensitive" }
                        }
                    }),
                    prisma_1.default.appointment.findMany({
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
                    prisma_1.default.appointment.count({
                        where: {
                            patient_id: user.patient_id,
                            physician_id: user.physician_id
                        }
                    }),
                    prisma_1.default.appointment.findMany({
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
                const appointment = yield prisma_1.default.appointment.findUnique({
                    where: { appointment_id }
                });
                if (!appointment) {
                    return res.status(404).json({ err: 'Appointment not found' });
                }
                if (appointment.patient_id !== user.patient_id) {
                    return res.status(401).json({ err: 'You are not authorized to delete selected appointment.' });
                }
                const delete_appointment = yield prisma_1.default.appointment.delete({
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