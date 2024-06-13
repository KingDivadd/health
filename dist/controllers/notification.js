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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const { Decimal } = require('decimal.js');
const bcrypt = require('bcrypt');
const prisma = new client_1.PrismaClient();
class Notification {
    constructor() {
        this.allNotifications = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.account_holder.user;
                const patient_id = user.patient_id || null;
                const physician_id = user.physician_id || null;
                const all_notification = yield prisma.notification.findMany({
                    where: {
                        patient_id, physician_id
                    }
                });
                return res.status(200).json({ nbHit: all_notification.length, notification: all_notification });
            }
            catch (err) {
                console.log(`Error fetching all notifications err: `, err);
                return res.status(500).json({ err: `Error fetching all notifications err: `, error: err });
            }
        });
    }
}
exports.default = new Notification;
//# sourceMappingURL=notification.js.map