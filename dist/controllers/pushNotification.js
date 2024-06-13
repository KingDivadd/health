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
class Notification {
    constructor() {
        this.webPushNotification = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { subscription, url, title, body, avatar } = req.body;
            try {
                console.log('Subscription:', subscription);
                const payloadData = {
                    title: title,
                    body: body,
                    icon: avatar || 'https://images.pexels.com/photos/5083013/pexels-photo-5083013.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
                    url: url
                };
                const payload = JSON.stringify(payloadData);
                web_push_1.default.sendNotification(subscription, payload)
                    .then(() => {
                    console.log('Push notification sent successfully.');
                    res.status(201).json({ data: payloadData, test: 'teting', body: body });
                })
                    .catch(err => {
                    console.error('Error sending notification:', err);
                    res.status(500).json({ error: 'Error sending notification' });
                });
            }
            catch (err) {
                console.log('Error occured during sending of web push notification, error: ', err);
                return res.status(500).json({ err: 'Error occured during sending of web push notification', error: err });
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