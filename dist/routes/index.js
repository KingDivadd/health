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
const router = express_1.default.Router();
const { physicianSetupProfileValidation, physicianDataValidation, physicianLoginValidation, physicianSignupValidation, filterPhysicianValidation, acceptAppointmentValidation, filterAppointmentValidation } = physicianValidation_1.default;
const { isRegisteredPatient, isRegisteredPhysician, emailExist, verifyAuthId, verifyOtpId, isLoggedIn, } = auth_1.default;
const { patientSignup, physicianSignup, patientLogin, physicianLogin, generateUserOTP, signupGenerateUserOTP, verifyPatientOTP, verifyPhysicianOTP, resetPatientPassword, resetPhysicianPassword, } = authentication_1.default;
const { patientUpdateCompletionValidation, patientOrgProfileCompletionValidation, patientEditValidation, patientLoginValidation, patientSignupValidation, encryptedDataValidation, bookAppointmentValidation, } = patientValidation_1.default;
const { loggedInPatient, loggedInPhysician, editPatientData, signupUpdatePatientData, editPhysicianData, singupUpdatePhysicianData, filterPhysicians, allPhysicians } = users_1.default;
const { genOtpValidation, passwordUpdateValidation, verifyOtpValidation } = authValidation_1.default;
const { openChat, getChats } = chat_1.default;
const { decryptData, encryptData, account, accountTransaction } = userAccount_1.default;
const { createAppointment, updateAppointment, allAppointments, filterAppointments } = appointment_1.default;
const { generateVideoSdkToken, createMeeting, joinMeeting, createRoom } = videoChat_1.default;
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
router.route('/filter-physician/:page_number').post(filterPhysicianValidation, filterPhysicians);
// Appointment
router.route('/create-appointment').post(isLoggedIn, bookAppointmentValidation, createAppointment);
router.route('/accept-appointment').patch(isLoggedIn, acceptAppointmentValidation, updateAppointment);
router.route('/reject-appointment').patch(isLoggedIn, acceptAppointmentValidation, updateAppointment);
router.route('/get-appointment/:page_number').get(isLoggedIn, allAppointments);
router.route('/filter-appointment/:page_number').post(isLoggedIn, filterAppointments);
// Chat
router.route('/get-chats/:patient_id/:physician_id').get(isLoggedIn, getChats);
// VideoSDK
router.route('/generate-token').post(isLoggedIn, generateVideoSdkToken);
router.route('/create-meeting').post(createMeeting);
router.route('/join-meeting').post(joinMeeting);
router.route('/create-room').post(createRoom);
// User Account
router.route('/encrypt-data').post(encryptData);
router.route('/decrypt-transaction-data').post(encryptedDataValidation, decryptData);
router.route('/patient-account').get(isLoggedIn, account);
router.route('/physician-account').get(isLoggedIn, account);
router.route('/patient-transaction').get(isLoggedIn, accountTransaction);
router.route('/physician-transaction').get(isLoggedIn, accountTransaction);
exports.default = router;
//# sourceMappingURL=index.js.map