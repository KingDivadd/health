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
const prisma_1 = __importDefault(require("../helpers/prisma"));
class Notification {
    constructor() {
        this.allNotifications = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.account_holder.user;
                const patient_id = user.patient_id;
                const physician_id = user.physician_id;
                const status = "";
                const notification = yield prisma_1.default.notification.findMany({
                    where: {
                        patient_id, physician_id, status: { contains: status, mode: "insensitive" }, notification_for_patient: patient_id ? true : false
                    }, include: {
                        patient: {
                            select: { last_name: true, first_name: true, other_names: true, avatar: true, gender: true }
                        },
                        physician: {
                            select: { last_name: true, first_name: true, other_names: true, avatar: true, gender: true, speciality: true, registered_as: true, bio: true, }
                        },
                        appointment: true,
                        case_note: true,
                        transaction: true
                    }, orderBy: {
                        created_at: 'desc'
                    },
                });
                return res.status(200).json({ nbHit: notification.length, notification });
            }
            catch (err) {
                console.log(`Error fltering notifications err: `, err);
                return res.status(500).json({ err: `Error filtering notifications err `, error: err });
            }
        });
        this.filterNotification = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { status } = req.body;
            try {
                const user = req.account_holder.user;
                const patient_id = user.patient_id;
                const physician_id = user.physician_id;
                const notification = yield prisma_1.default.notification.findMany({
                    where: {
                        status, patient_id, physician_id, notification_for_patient: patient_id ? true : false
                    }, include: {
                        patient: {
                            select: { last_name: true, first_name: true, other_names: true, avatar: true, gender: true }
                        },
                        physician: {
                            select: { last_name: true, first_name: true, other_names: true, avatar: true, gender: true, speciality: true, registered_as: true, bio: true, }
                        },
                        appointment: true,
                        case_note: true,
                        transaction: true
                    }, orderBy: {
                        created_at: 'desc'
                    },
                });
                return res.status(200).json({ nbHit: notification.length, notification });
            }
            catch (err) {
                console.log(`Error fltering notifications err: `, err);
                return res.status(500).json({ err: `Error filtering notifications err `, error: err });
            }
        });
        this.deleteNotification = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { notificationId } = req.params;
                const user = req.account_holder.user;
                const notificationExist = yield prisma_1.default.notification.findUnique({
                    where: { notification_id: notificationId }
                });
                if (!notificationExist) {
                    return res.status(404).json({ err: 'Selected notification not found, might be deleted.' });
                }
                if (notificationExist && ((notificationExist === null || notificationExist === void 0 ? void 0 : notificationExist.patient_id) !== user.patient_id || (notificationExist === null || notificationExist === void 0 ? void 0 : notificationExist.physician_id) !== user.physician_id)) {
                    return res.status(401).json({ err: `You're not authorized to deleted selected notification.` });
                }
                const removeNotification = yield prisma_1.default.notification.delete({
                    where: {
                        notification_id: notificationId,
                        patient_id: user.patient_id,
                        physician_id: user.physician_id
                    }
                });
                return res.status(200).json({ msg: "Selected notification deleted successfully." });
            }
            catch (err) {
                console.log(`Error deleting selected err: `, err);
                return res.status(500).json({ err: `Error deleting selected error err: `, error: err });
            }
        });
    }
}
exports.default = new Notification;
//# sourceMappingURL=notification.js.map