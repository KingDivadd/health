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
const index_1 = require("../index");
const jwt = require('jsonwebtoken');
const prisma = new client_1.PrismaClient();
class VideoChat {
    constructor() {
        this.generateToken = (req, res, next) => {
            const { appointment_id } = req.body;
            try {
                if (!appointment_id || appointment_id.trim() == "") {
                    return res.status(400).json({ err: 'Please provide the appointment id' });
                }
                const options = { expiresIn: "23h", algorithm: "HS256" };
                const payload = {
                    appointment_id,
                    apikey: constants_1.videosdk_api_key,
                    permissions: ["allow_join", "allow_mod"],
                };
                const token = jwt.sign(payload, constants_1.videosdk_secret_key, options);
                res.json({ token });
            }
            catch (err) {
                console.log('Error occured while generating video sdk token. error: ', err);
                return res.status(500).json({ err: 'Error occured while generating video sdk token. error: ', error: err });
            }
        };
        this.createMeeting = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { appointment_id } = req.body;
            try {
                const token = req.headers['authorization'];
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                if (!appointment_id || appointment_id.trim() == "") {
                    return res.status(400).json({ err: 'Please provide the appointment id' });
                }
                const appointment = yield prisma.appointment.findUnique({ where: { appointment_id } });
                if (!appointment) {
                    return res.status(404).json({ err: 'Appointemnt not found' });
                }
                const user = req.account_holder.user;
                let patient_id = user.patient_id || '';
                let physician_id = user.physician_id || '';
                let call_receiver = patient_id ? appointment.physician_id : (physician_id ? appointment.patient_id : null);
                let caller = patient_id ? patient_id : (physician_id ? physician_id : null);
                if (call_receiver == null) {
                    return res.status(400).json({ err: 'Unable to determine the call receiver.' });
                }
                const response = yield axios_1.default.post(`${constants_1.videosdk_endpoint}/v2/rooms`, { userMeetingId: appointment_id }, {
                    headers: {
                        Authorization: token,
                    },
                });
                // now add a socket connection
                const meetingId = response.data.roomId;
                index_1.io.emit(`video-call-${call_receiver}`, {
                    meetingId: meetingId,
                    caller_id: caller,
                    patient_id: appointment.patient_id,
                    physician_id: appointment.physician_id
                });
                console.log(response.data);
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while creating meeting: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while creating meeting.', error: err.request
                    });
                }
                else {
                    console.error('Error creating meeting:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while creating meeting.', error: err.message
                    });
                }
            }
        });
        this.validateMeeting = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const meetingId = req.params.meetingId;
                if (!meetingId) {
                    return res.status(400).json({ err: 'Invalid meeting id' });
                }
                const response = yield axios_1.default.get(`${constants_1.videosdk_endpoint}/v2/rooms/${meetingId}`, {
                    headers: {
                        Authorization: token,
                    },
                });
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while validating meeting: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while validating meeting.', error: err.request
                    });
                }
                else {
                    console.error('Error validating meeting:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while vaidating meeting.', error: err.message
                    });
                }
            }
        });
        this.listMeeting = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const { page_number } = req.params;
                const per_page = 15;
                const response = yield axios_1.default.get(`${constants_1.videosdk_endpoint}/v2/rooms?page=${page_number}&perPage=${per_page}`, {
                    headers: {
                        Authorization: token,
                        'Content-Type': 'application/json',
                    }
                });
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while listing meetings: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while listing meetings.', error: err.request
                    });
                }
                else {
                    console.error('Error listing meetings:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while listing meetings.', error: err.message
                    });
                }
            }
        });
        this.listSelectedMeeting = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const { roomId } = req.params;
                if (!roomId) {
                    return res.status(400).json({ err: 'Invalid meeting id' });
                }
                const response = yield axios_1.default.get(`${constants_1.videosdk_endpoint}/v2/rooms/${roomId}`, {
                    headers: {
                        Authorization: token,
                    },
                });
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while fetching selected meeting: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while fetching selected meeting.', error: err.request
                    });
                }
                else {
                    console.error('Error fetching selected meeting:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while fetching selected meeting.', error: err.message
                    });
                }
            }
        });
        this.deActivateMeeting = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const { roomId } = req.params;
                if (!roomId || roomId === "") {
                    return res.status(400).json({ err: 'Please provide a valid room ID' });
                }
                const response = yield axios_1.default.post('https://api.videosdk.live/v2/rooms/deactivate', { roomId }, {
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    }
                });
                console.log('Deactivation response: ', response.data);
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while deactivating the meeting. error: ',
                        error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while deactivating the meeting.',
                        error: err.request
                    });
                }
                else {
                    console.error('Error deactivating selected meeting:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while deactivating selected meeting.',
                        error: err.message
                    });
                }
            }
        });
        this.listMeetingSession = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const per_page = 15;
                const { roomId, page_number } = req.params;
                if (!roomId) {
                    return res.status(400).json({ err: 'Invalid meeting id' });
                }
                const response = yield axios_1.default.get(`${constants_1.videosdk_endpoint}/v2/sessions/?roomId=${roomId}&page=${page_number}&perPage=${per_page}`, {
                    headers: {
                        Authorization: token,
                    },
                });
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while listing meeting sessions: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while listing meeting sessions.', error: err.request
                    });
                }
                else {
                    console.error('Error listing meeting sessions:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while listing meeting sessions.', error: err.message
                    });
                }
            }
        });
        this.getSessionDetails = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const { sessionId } = req.params;
                const response = yield axios_1.default.get(`${constants_1.videosdk_endpoint}/v2/sessions/${sessionId}`, {
                    headers: {
                        Authorization: token,
                    },
                });
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while fetching session details: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while fetching session details.', error: err.request
                    });
                }
                else {
                    console.error('Error fetching session details:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while fetching session details.', error: err.message
                    });
                }
            }
        });
        this.fetchParticipant = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const per_page = 15;
                const { sessionId } = req.params;
                const response = yield axios_1.default.get(`${constants_1.videosdk_endpoint}/v2/sessions/${sessionId}/participants?page=1&perPage=${per_page}`, {
                    headers: {
                        Authorization: token,
                    },
                });
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while fetching participant: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while fetching active participant.', error: err.request
                    });
                }
                else {
                    console.error('Error fetching participant:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while fetching participant.', error: err.message
                    });
                }
            }
        });
        this.fetchActiveParticipant = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const per_page = 15;
                const { sessionId } = req.params;
                const response = yield axios_1.default.get(`${constants_1.videosdk_endpoint}/v2/sessions/${sessionId}/participants/active?page=1&perPage=${per_page}`, {
                    headers: {
                        Authorization: token,
                    },
                });
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while fetching active participant: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while fetching active participant.', error: err.request
                    });
                }
                else {
                    console.error('Error fetching active participant:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while fetching active participant.', error: err.message
                    });
                }
            }
        });
        this.endMeetingSession = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            const { roomId, sessionId } = req.body;
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const response = yield axios_1.default.post(`${constants_1.videosdk_endpoint}/v2/sessions/end`, { roomId, sessionId }, {
                    headers: {
                        Authorization: token,
                        "Content-Type": "application/json"
                    },
                });
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while ending meeting session: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while ending meeting session.', error: err.request
                    });
                }
                else {
                    console.error('Error ending meeting session:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while ending meeting session.', error: err.message
                    });
                }
            }
        });
        this.removeParticipant = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['authorization'];
            const { particiapantId, roomId, sessionId } = req.body;
            try {
                if (!token || token === "") {
                    return res.status(400).json({ err: 'Please provide a valid token' });
                }
                const response = yield axios_1.default.post(`${constants_1.videosdk_endpoint}/v2/sessions/participants/remove`, { particiapantId, roomId, sessionId }, {
                    headers: {
                        Authorization: token,
                    },
                });
                return res.status(200).json(response.data);
            }
            catch (err) {
                if (err.response) {
                    console.error('Error response from API:', err.response.data);
                    return res.status(err.response.status).json({
                        err: 'Error occurred while removing selected participant: ', error: err.response.data
                    });
                }
                else if (err.request) {
                    console.error('No response received from API:', err.request);
                    return res.status(500).json({
                        err: 'No response received from API while removing selected participant.', error: err.request
                    });
                }
                else {
                    console.error('Error removing selected participant:', err.message);
                    return res.status(500).json({
                        err: 'Error occurred while removing selected participant.', error: err.message
                    });
                }
            }
        });
    }
}
exports.default = new VideoChat;
//# sourceMappingURL=videoChat.js.map