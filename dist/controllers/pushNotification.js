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
const web_push_1 = __importDefault(require("web-push"));
const apn_1 = __importDefault(require("apn"));
const currrentDateTime_1 = __importDefault(require("../helpers/currrentDateTime"));
const prisma_1 = __importDefault(require("../helpers/prisma"));
class Notification {
    constructor() {
        this.saveSubscription = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { subscription } = req.body;
            try {
                const user = req.account_holder.user;
                const patient_id = user.patient_id || null;
                const physician_id = user.physician_id || null;
                // Check if the subscription already exists
                const existingSubscription = yield prisma_1.default.subscription.findFirst({
                    where: {
                        patient_id: patient_id || undefined,
                        physician_id: physician_id || undefined,
                        subscription
                    }
                });
                if (existingSubscription) {
                    return res.status(200).json({ msg: 'Subscription already exists', existingSubscription });
                }
                // Create a new subscription
                const newSubscription = yield prisma_1.default.subscription.create({
                    data: {
                        patient_id: patient_id || null,
                        physician_id: physician_id || null,
                        subscription,
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)(),
                    },
                });
                return res.status(201).json({ msg: 'New subscription added', newSubscription });
            }
            catch (error) {
                console.error('Error saving subscription:', error);
                return res.status(500).json({ error: 'Error saving subscription' });
            }
        });
        this.webPushNotification = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, body, avatar, message, data } = req.pushNotificationData;
                const user = req.account_holder.user;
                const patient_id = user.patient_id || '';
                const physician_id = user.physician_id || '';
                // getting the subscription
                console.log('patient id => ', patient_id, 'physician id => ', physician_id);
                const userSubscription = yield prisma_1.default.subscription.findFirst({
                    where: {
                        patient_id: patient_id || undefined,
                        physician_id: physician_id || undefined,
                    },
                });
                console.log('five');
                if (userSubscription) {
                    const payloadData = {
                        title: title,
                        body: body,
                        icon: avatar || 'https://images.pexels.com/photos/5083013/pexels-photo-5083013.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
                    };
                    const payload = JSON.stringify(payloadData);
                    try {
                        yield web_push_1.default.sendNotification(JSON.parse(userSubscription.subscription), payload);
                        console.log('Push notification sent successfully.');
                    }
                    catch (err) {
                        console.error('Error sending notification:', err);
                        // Handle the error if needed, but don't send the response here
                    }
                }
                else {
                    return res.status(200).json({ msg: message, data, pushNotification: 'Receiver\'s subscription was not found.' });
                }
                // Send the response after attempting to send the push notification
                return res.status(200).json({ msg: message, data });
            }
            catch (err) {
                console.log('Error occurred during sending of web push notification, error:', err);
                return res.status(500).json({ err: 'Error occurred during sending of web push notification', error: err });
            }
        });
        this.socketWebPushNotification = (user_id, user_data, title, body) => __awaiter(this, void 0, void 0, function* () {
            try {
                // user data will contain the 1. callers avatar, 2. callers first and last_name
                // user data should contain 1. title, 2. avatar, 3. body (the message to be send the receiver), 4. 
                const { title, body, avatar, message, data } = user_data;
                const userSubscription = yield prisma_1.default.subscription.findFirst({
                    where: {
                        patient_id: user_id,
                        physician_id: user_id,
                    },
                });
                if (userSubscription) {
                    const payloadData = {
                        title: title,
                        body: body,
                        icon: avatar || 'https://images.pexels.com/photos/5083013/pexels-photo-5083013.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
                    };
                    const payload = JSON.stringify(payloadData);
                    try {
                        yield web_push_1.default.sendNotification(JSON.parse(userSubscription.subscription), payload);
                        console.log('Push notification sent successfully.');
                    }
                    catch (err) {
                        console.error('Error sending notification:', err);
                        // Handle the error if needed, but don't send the response here
                    }
                }
                else {
                    return { statusCode: 404, message: `Receiver's subscription was not found` };
                }
                // Send the response after attempting to send the push notification
                return { statusCode: 200, message: `Push notification sent successfully` };
            }
            catch (err) {
                console.log('Error occurred during sending of web push notification, error:', err);
                return { statusCode: 500, message: 'Error occured during sending of push notification' };
            }
        });
        this.iosPushNotification = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { deviceToken, alert, payload, topic } = req.body;
                // first set up the ios push notification
                const options = {
                    token: {
                        key: "path/to/AuthKey_XXXXXXXXXX.p8", // Path to the .p8 file
                        keyId: "YOUR_KEY_ID", // The Key ID
                        teamId: "YOUR_TEAM_ID" // Your Team ID
                    },
                    production: false // Set to true if sending a notification to a production iOS app
                };
                const apnProvider = new apn_1.default.Provider(options);
                let notification = new apn_1.default.Notification();
                notification.alert = alert || "Hello Olatokumbo, this is a test notification";
                notification.payload = payload || { title: 'Greetings', message: "Where you come see light charge your pc", avatar: "http://david-pic.png" };
                notification.topic = topic || "Hello Olatokumbo";
                apnProvider.send(notification, deviceToken)
                    .then(result => {
                    res.json({ success: true, result });
                }).catch(err => {
                    console.error("Error sending notification:", err);
                    res.status(500).json({ success: false, error: err });
                });
            }
            catch (err) {
                console.log('Error occured during sending of ios push notification, error: ', err);
                return res.status(500).json({ err: 'Error occured during sending of ios push notification', error: err });
            }
        });
    }
}
exports.default = new Notification;
//# sourceMappingURL=pushNotification.js.map