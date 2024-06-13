"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patientValidation_1 = __importDefault(require("../validations/patientValidation"));
const physicianValidation_1 = __importDefault(require("../validations/physicianValidation"));
const authValidation_1 = __importDefault(require("../validations/authValidation"));
const auth_1 = __importDefault(require("../helpers/auth"));
const authentication_1 = __importDefault(require("../controllers/authentication"));
const users_1 = __importDefault(require("../controllers/users"));
const chat_1 = __importDefault(require("../controllers/chat"));
const userAccount_1 = __importDefault(require("../controllers/userAccount"));
const appointment_1 = __importDefault(require("../controllers/appointment"));
const videoChat_1 = __importDefault(require("../controllers/videoChat"));
const caseNote_1 = __importDefault(require("../controllers/caseNote"));
const pushNotification_1 = __importDefault(require("../controllers/pushNotification"));
const chatValidation_1 = __importDefault(require("../validations/chatValidation"));
const router = express_1.default.Router();
const { endMeetingSessionValid, removeParticipantValid } = chatValidation_1.default;
const { webPushNotification } = pushNotification_1.default;
const { physicianSetupProfileValidation, physicianDataValidation, physicianLoginValidation, physicianSignupValidation, filterPhysicianValidation, updateAppointmentValidation, createCaseNoteValid, updateCaseNoteValid, cancelAppointmentValidation } = physicianValidation_1.default;
const { isRegisteredPatient, isRegisteredPhysician, emailExist, verifyAuthId, verifyOtpId, isLoggedIn, } = auth_1.default;
const { patientSignup, physicianSignup, patientLogin, physicianLogin, generateUserOTP, signupGenerateUserOTP, verifyPatientOTP, verifyPhysicianOTP, resetPatientPassword, resetPhysicianPassword, } = authentication_1.default;
const { patientUpdateCompletionValidation, patientOrgProfileCompletionValidation, patientEditValidation, patientLoginValidation, patientSignupValidation, encryptedDataValidation, bookAppointmentValidation, } = patientValidation_1.default;
const { loggedInPatient, loggedInPhysician, editPatientData, signupUpdatePatientData, editPhysicianData, singupUpdatePhysicianData, filterPhysicians, allPhysicians } = users_1.default;
const { genOtpValidation, passwordUpdateValidation, verifyOtpValidation } = authValidation_1.default;
const { openChat, getChats, clearChat } = chat_1.default;
const { decryptDepositData, decryptWithdrawalData, encryptData, account, accountTransaction } = userAccount_1.default;
const { createAppointment, cancelAppointment, updateAppointment, allAppointments, filterAppointments, deleteAppointment } = appointment_1.default;
const { generateToken, createMeeting, validateMeeting, listMeeting, listSelectedMeeting, deActivateMeeting, listMeetingSession, getSessionDetails, endMeetingSession, fetchActiveParticipant, removeParticipant, fetchParticipant } = videoChat_1.default;
const { allCaseNote, createCaseNote, deleteCaseNote, updateCaseNote } = caseNote_1.default;
// Authentication
router.route('/patient-signup').post(patientSignupValidation, emailExist, patientSignup);
router.route('/physician-signup').post(physicianSignupValidation, emailExist, physicianSignup);
router.route('/patient-login').post(patientLoginValidation, patientLogin);
router.route('/physician-login').post(physicianLoginValidation, physicianLogin);
router.route('/generate-patient-otp').post(genOtpValidation, isRegisteredPatient, generateUserOTP);
router.route('/generate-physician-otp').post(genOtpValidation, isRegisteredPhysician, generateUserOTP);
router.route('/regenerate-otp').post(verifyOtpId, signupGenerateUserOTP);
router.route('/verify-patient-otp').patch(verifyOtpValidation, verifyOtpId, verifyPatientOTP);
router.route('/verify-physician-otp').patch(verifyOtpValidation, verifyOtpId, verifyPhysicianOTP);
router.route('/reset-patient-password').patch(passwordUpdateValidation, verifyAuthId, resetPatientPassword);
router.route('/reset-physician-password').patch(passwordUpdateValidation, verifyAuthId, resetPhysicianPassword);
// users
router.route('/logged-in-patient').post(isLoggedIn, loggedInPatient);
router.route('/logged-in-physician').post(isLoggedIn, loggedInPhysician);
router.route('/signup-update-patient-data').patch(patientUpdateCompletionValidation, verifyAuthId, signupUpdatePatientData, signupGenerateUserOTP);
router.route('/signup-update-organiation-patient-data').patch(patientOrgProfileCompletionValidation, verifyAuthId, signupUpdatePatientData, signupGenerateUserOTP);
router.route('/edit-patient-data').patch(patientEditValidation, isLoggedIn, editPatientData);
router.route('/signup-update-physician-data').patch(physicianSetupProfileValidation, verifyAuthId, singupUpdatePhysicianData, signupGenerateUserOTP);
router.route('/edit-physician-data').patch(physicianDataValidation, isLoggedIn, editPhysicianData);
router.route('/all-physicians/:page_number').get(isLoggedIn, allPhysicians);
router.route('/filter-physician/:page_number').post(filterPhysicianValidation, isLoggedIn, filterPhysicians);
// Appointment
router.route('/create-appointment').post(isLoggedIn, bookAppointmentValidation, createAppointment);
router.route('/accept-appointment').patch(isLoggedIn, updateAppointmentValidation, updateAppointment);
router.route('/reject-appointment').patch(isLoggedIn, updateAppointmentValidation, updateAppointment);
router.route('/cancel-appointment').patch(isLoggedIn, cancelAppointmentValidation, cancelAppointment);
router.route('/get-appointment/:page_number').get(isLoggedIn, allAppointments);
router.route('/filter-appointment/:status/:page_number').get(isLoggedIn, filterAppointments);
router.route('/delete-appointment/:appointment_id').delete(isLoggedIn, deleteAppointment, clearChat);
// Chat
router.route('/get-chats/:patient_id/:physician_id').get(isLoggedIn, getChats);
router.route('/clear-chat/:appointment_id').delete(clearChat);
// VideoSDK
router.route('/generate-token').post(isLoggedIn, generateToken);
router.route('/create-meeting').post(isLoggedIn, createMeeting);
router.route('/validate-meeting/:meetingId').get(isLoggedIn, validateMeeting);
router.route('/list-meeting/:page_number').get(isLoggedIn, listMeeting);
router.route('/get-meeting-details/:roomId').get(isLoggedIn, listSelectedMeeting);
router.route('/deactivate-meeting/:roomId').post(isLoggedIn, deActivateMeeting);
router.route('/list-meeting-sessions/:roomId/:page_number').get(isLoggedIn, listMeetingSession);
router.route('/get-session-details/:sessionId').get(isLoggedIn, getSessionDetails);
router.route('/fetch-participants/:sessionId').get(isLoggedIn, fetchActiveParticipant);
router.route('/fetch-active-participants/:sessionId').get(isLoggedIn, fetchActiveParticipant);
router.route('/end-meeting-session').post(isLoggedIn, endMeetingSessionValid, endMeetingSession);
router.route('/remove-participant').post(isLoggedIn, removeParticipantValid, removeParticipant);
// User Account
router.route('/encrypt-data').post(encryptData);
router.route('/decrypt-deposit-transaction-data').post(isLoggedIn, encryptedDataValidation, decryptDepositData);
router.route('/decrypt-withdrawal-transaction-data').post(isLoggedIn, encryptedDataValidation, decryptWithdrawalData);
router.route('/patient-account').get(isLoggedIn, account);
router.route('/physician-account').get(isLoggedIn, account);
router.route('/patient-transaction').get(isLoggedIn, accountTransaction);
router.route('/physician-transaction').get(isLoggedIn, accountTransaction);
// Case Notes
router.route('/all-case-note/:patient_id').get(isLoggedIn, allCaseNote);
router.route('/add-case-note').post(isLoggedIn, createCaseNoteValid, createCaseNote);
router.route('/update-case-note/:caseNote_id').patch(isLoggedIn, updateCaseNoteValid, updateCaseNote);
router.route('/delete-case-note/:caseNote_id').delete(isLoggedIn, deleteCaseNote);
// Push Notofication
router.route('/subscribe').post(webPushNotification);
exports.default = router;
//# sourceMappingURL=index.js.map