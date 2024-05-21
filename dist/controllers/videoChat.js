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
const constants_1 = require("../helpers/constants");
const axios_1 = __importDefault(require("axios"));
const jwt = require('jsonwebtoken');
const prisma = new client_1.PrismaClient();
class VideoChat {
    constructor() {
        this.generateVideoSdkToken = (req, res, next) => {
            const { appointment_id } = req.body;
            try {
                const user = req.account_holder.user;
                const user_boo = { patient: false, physician: false };
                let user_id = '';
                if (user.patient_id) {
                    user_id = user.patient_id;
                    user_boo.patient = true;
                }
                else if (user.physician_id) {
                    user_id = user.physician_id;
                    user_boo.physician = true;
                }
                const options = {
                    expiresIn: '120m',
                    algorithm: 'HS256'
                };
                const payload = {
                    appointment_id,
                    apikey: constants_1.videsdk_api_key,
                    permissions: [`allow_join`], // `ask_join` || `allow_mod` 
                    version: 2, //OPTIONAL
                    roomId: `2kyv-gzay-64pg`, //OPTIONAL
                    participantId: user_id, //OPTIONAL 
                    is_patient: user_boo.patient,
                    is_physician: user_boo.physician,
                    roles: ['crawler', 'rtc'], //OPTIONAL
                };
                const token = jwt.sign(payload, constants_1.videsdk_secret_key, options);
                return res.status(200).json({ token });
            }
            catch (err) {
                console.log(`Error occured while generating video sdk jwt token err: ${err}`, err);
                return res.status(500).json({ err: `Error occured while generating video sdk jwt token err: ${err}` });
            }
        };
        this.createMeeting = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { token } = req.body;
            try {
                const headers = {
                    "Authorization": token,
                    "Content-Type": "application/json",
                };
                const body = {
                    userMeetingId: "unicorn"
                };
                const url = "https://api.videosdk.live/v1/meetings";
                const response = yield axios_1.default.post(url, body, { headers });
                const result = response.data;
                console.log(result);
                return res.status(200).json({ msg: 'Created a new meeting', meeting: result });
            }
            catch (err) {
                console.log(`Error occured while creating meeting err:`, err.response.data);
                return res.status(err.response.data.statusCode).json({ err: `${err.response.data.error}` });
            }
        });
        this.joinMeeting = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { token, meetingId } = req.body;
            if (!token || !meetingId) {
                return res.status(400).json({ error: 'Token and Meeting ID are required' });
            }
            try {
                const headers = {
                    "Authorization": token,
                    "Content-Type": "application/json",
                };
                const url = `https://api.videosdk.live/v1/meetings/${meetingId}`;
                console.log('Token:', token);
                console.log('Meeting ID:', meetingId);
                const response = yield axios_1.default.get(url, { headers });
                const result = response.data;
                return res.status(200).json({ msg: 'Fetching meeting', meeting: result });
            }
            catch (err) {
                console.log('Error occurred while joining meeting:', ((_a = err.response) === null || _a === void 0 ? void 0 : _a.data) || err.message);
                return res.status(500).json({ error: ((_b = err.response) === null || _b === void 0 ? void 0 : _b.data) || 'An error occurred' });
            }
        });
        // createRoom = async (req: Request, res: Response, next: NextFunction) => {
        //     const {token} = req.body
        //     try {
        //         const headers = {
        //             "Authorization": token,
        //             "Content-Type": "application/json",
        //         }
        //         const body = {
        //             "customRoomId" : "aaa-bbb-ccc",
        //             "webhook" : "see example",
        //             "autoCloseConfig" : "see example",
        //             "autoStartConfig" : "see example",
        //             "multiComposition" : "multiCompositionObj"
        //         }
        //         const url= `https://api.videosdk.live/v2/rooms`;
        //         const response = await axios.post(url, body, {headers});
        //         const result = response.data
        //         return res.status(200).json({msg: 'room created successfully', room: result})
        //     } catch (err:any) {
        //         console.log(`Error occurred while creating room: ${err}`,err.response);
        //         return res.status(500).json({ err: `Error occurred while creating room: ${err.response.data}` });
        //     }
        // }
        this.createRoom = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { token } = req.body;
            try {
                const headers = {
                    Authorization: token,
                    "Content-Type": "application/json",
                };
                const body = {
                    "customRoomId": "aaa-bbb-ccc",
                    "webhook": "example.webhook",
                    "autoCloseConfig": "example",
                    "autoStartConfig": "example",
                    "multiComposition": "multiCompositionObj"
                };
                const url = `https://api.videosdk.live/v2/rooms`;
                const response = yield axios_1.default.post(url, body, { headers });
                const result = response.data;
                return res.status(200).json({ msg: "room created successfully", room: result });
            }
            catch (err) {
                console.log(`Error occurred while creating room: ${err}`, err.response);
                if (err.response && err.response.data) {
                    return res.status(500).json({ err: err.response.data });
                }
                else {
                    return res.status(500).json({ err: "Error creating room" });
                }
            }
        });
    }
}
exports.default = new VideoChat;
//# sourceMappingURL=videoChat.js.map