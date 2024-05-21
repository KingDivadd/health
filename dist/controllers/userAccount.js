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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const decryption_1 = __importStar(require("../helpers/decryption"));
const currrentDateTime_1 = __importDefault(require("../helpers/currrentDateTime"));
const prisma = new client_1.PrismaClient();
class Account {
    constructor() {
        this.encryptData = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { patient_id, amount } = req.body;
            try {
                const encrypt_data_string = yield (0, decryption_1.handleEncrypt)(JSON.stringify(req.body));
                return res.status(200).json({ msg: 'Encrypted successfully', encrypt_data_string });
            }
            catch (error) {
                console.log("error during transaction initialization", error);
                return res.status(500).json({ err: 'Error during transaction initialization ', error: error });
            }
        });
        this.decryptData = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { encrypted_data } = req.body;
            try {
                const decrypted_data = yield (0, decryption_1.default)(encrypted_data);
                const parsed_decrypted_data = JSON.parse(decrypted_data);
                // first get user
                const patient = yield prisma.account.findFirst({
                    where: {
                        patient_id: parsed_decrypted_data === null || parsed_decrypted_data === void 0 ? void 0 : parsed_decrypted_data.patient_id
                    }
                });
                if (patient == null) {
                    return res.status(404).json({ err: 'Patient not found' });
                }
                if (patient) {
                    const update_account = yield prisma.account.update({
                        where: {
                            account_id: patient.account_id // Assuming account_id is unique
                        },
                        data: {
                            available_balance: {
                                increment: parsed_decrypted_data.amount / 100,
                            }
                        }
                    });
                }
                // now add to transaction table
                const new_transaction = yield prisma.transaction.create({
                    data: {
                        amount: parsed_decrypted_data.amount / 100,
                        account_id: patient.account_id,
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)(),
                    }
                });
                return res.status(200).json({ msg: 'Account updated successfully', });
            }
            catch (error) {
                console.log("error during transaction initialization", error);
                return res.status(500).json({ err: 'Error during transaction initialization ', error: error });
            }
        });
        this.account = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const user = req.account_holder.user;
            try {
                let user_id = '';
                if (user.patient_id) {
                    user_id = user.patient_id;
                    const patient_account = yield prisma.account.findFirst({
                        where: {
                            patient_id: user_id
                        }
                    });
                    if (!patient_account) {
                        return res.status(404).json({ err: `User doesn't have an account yet.` });
                    }
                    return res.status(200).json({ patient_account });
                }
                else if (user.physician_id) {
                    user_id = user.physician_id;
                    const physician_account = yield prisma.account.findFirst({
                        where: {
                            physician_id: user_id
                        }
                    });
                    if (!physician_account) {
                        return res.status(404).json({ err: `User doesn't have an account yet.` });
                    }
                    return res.status(200).json({ physician_account });
                }
            }
            catch (err) {
                console.log('Error getting patient account ', err);
                return res.status(500).json({ error: 'Error getting patient account ', err });
            }
        });
        this.accountTransaction = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const user = req.account_holder.user;
            try {
                let user_id = '';
                if (user.patient_id) {
                    user_id = user.patient_id;
                    const patient_account = yield prisma.account.findFirst({
                        where: {
                            patient_id: user_id,
                        }
                    });
                    if (!patient_account) {
                        return res.status(404).json({ err: `User doesn't have an account yet.` });
                    }
                    const patient_transaction = yield prisma.transaction.findMany({
                        where: {
                            account_id: patient_account.account_id
                        }
                    });
                    return res.status(200).json({ nbHit: patient_transaction.length, patient_transactions: patient_transaction });
                }
                else if (user.physician_id) {
                    user_id = user.physician_id;
                    const physician_account = yield prisma.account.findFirst({
                        where: {
                            physician_id: user_id
                        }
                    });
                    if (!physician_account) {
                        return res.status(404).json({ err: `User doesn't have an account yet.` });
                    }
                    const physician_transaction = yield prisma.transaction.findMany({
                        where: {
                            account_id: physician_account.account_id
                        }
                    });
                    return res.status(200).json({ nbHit: physician_transaction.length, physician_transactions: physician_transaction });
                }
            }
            catch (err) {
                console.log('Error getting patient account ', err);
                return res.status(500).json({ error: 'Error getting patient account ', err });
            }
        });
    }
}
exports.default = new Account;
//# sourceMappingURL=userAccount.js.map