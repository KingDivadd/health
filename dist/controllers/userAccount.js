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
const decryption_1 = __importStar(require("../helpers/decryption"));
const currrentDateTime_1 = __importDefault(require("../helpers/currrentDateTime"));
const index_1 = require("../index");
const prisma_1 = __importDefault(require("../helpers/prisma"));
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
        this.decryptDepositData = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { encrypted_data } = req.body;
            try {
                const decrypted_data = yield (0, decryption_1.default)(encrypted_data);
                const parsed_decrypted_data = JSON.parse(decrypted_data);
                // first get user
                let patient_id = '';
                let physician_id = '';
                if (parsed_decrypted_data === null || parsed_decrypted_data === void 0 ? void 0 : parsed_decrypted_data.patient_id) {
                    patient_id = parsed_decrypted_data === null || parsed_decrypted_data === void 0 ? void 0 : parsed_decrypted_data.patient_id;
                }
                else if (parsed_decrypted_data === null || parsed_decrypted_data === void 0 ? void 0 : parsed_decrypted_data.physician_id) {
                    physician_id = parsed_decrypted_data === null || parsed_decrypted_data === void 0 ? void 0 : parsed_decrypted_data.physician_id;
                }
                const user_account = yield prisma_1.default.account.findFirst({
                    where: {
                        patient_id: patient_id,
                        physician_id: physician_id,
                    }
                });
                if (user_account == null) {
                    return res.status(404).json({ err: 'User not found' });
                }
                if (user_account) {
                    if (parsed_decrypted_data.transaction_type.toLowerCase() === 'credit') {
                        const update_account = yield prisma_1.default.account.update({
                            where: {
                                account_id: user_account.account_id
                            },
                            data: {
                                available_balance: {
                                    increment: parsed_decrypted_data.amount / 100,
                                }
                            }
                        });
                    }
                    else {
                        return res.status(400).json({ err: 'Invalid deposit trnsaction type.' });
                    }
                }
                // now add to transaction table
                const new_transaction = yield prisma_1.default.transaction.create({
                    data: {
                        amount: parsed_decrypted_data.amount / 100,
                        transaction_type: parsed_decrypted_data.transaction_type,
                        patient_id: patient_id || "",
                        physician_id: physician_id || "",
                        account_id: user_account.account_id,
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)(),
                    }
                });
                // the notification sent to the patient
                const notification = yield prisma_1.default.notification.create({
                    data: {
                        appointment_id: null,
                        patient_id: (new_transaction === null || new_transaction === void 0 ? void 0 : new_transaction.patient_id) || null,
                        physician_id: (new_transaction === null || new_transaction === void 0 ? void 0 : new_transaction.physician_id) || null,
                        notification_type: "Transaction",
                        notification_for_patient: true,
                        transaction_id: new_transaction.transaction_id,
                        status: "completed",
                        case_note_id: null,
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)(),
                    }
                });
                if (notification) {
                    index_1.io.emit(`notification-${new_transaction.patient_id}`, {
                        statusCode: 200,
                        notificationData: notification,
                    });
                }
                return res.status(200).json({ msg: 'Account updated successfully', });
            }
            catch (error) {
                console.log("error during transaction initialization", error);
                return res.status(500).json({ err: 'Error during transaction initialization ', error: error });
            }
        });
        this.decryptWithdrawalData = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { encrypted_data } = req.body;
            try {
                const decrypted_data = yield (0, decryption_1.default)(encrypted_data);
                const parsed_decrypted_data = JSON.parse(decrypted_data);
                // first get user
                let patient_id = '';
                let physician_id = '';
                if (parsed_decrypted_data === null || parsed_decrypted_data === void 0 ? void 0 : parsed_decrypted_data.patient_id) {
                    patient_id = parsed_decrypted_data === null || parsed_decrypted_data === void 0 ? void 0 : parsed_decrypted_data.patient_id;
                }
                else if (parsed_decrypted_data === null || parsed_decrypted_data === void 0 ? void 0 : parsed_decrypted_data.physician_id) {
                    physician_id = parsed_decrypted_data === null || parsed_decrypted_data === void 0 ? void 0 : parsed_decrypted_data.physician_id;
                }
                const user_account = yield prisma_1.default.account.findFirst({
                    where: {
                        patient_id: patient_id,
                        physician_id: physician_id,
                    }
                });
                if (user_account == null) {
                    return res.status(404).json({ err: 'User not found' });
                }
                if (user_account) {
                    if (parsed_decrypted_data.transaction_type.toLowerCase() === 'debit') {
                        if ((user_account.available_balance - (parsed_decrypted_data.amount / 100)) < 0) {
                            return res.status(400).json({ err: 'You cannot withdraw an amount greater than you available balance' });
                        }
                        const update_account = yield prisma_1.default.account.update({
                            where: {
                                account_id: user_account.account_id
                            },
                            data: {
                                available_balance: {
                                    decrement: parsed_decrypted_data.amount / 100,
                                }
                            }
                        });
                    }
                    else {
                        return res.status(400).json({ err: 'Invalid withdrawal transaction type. should be debit.' });
                    }
                }
                // adding the transaction data
                const new_transaction = yield prisma_1.default.transaction.create({
                    data: {
                        amount: parsed_decrypted_data.amount / 100,
                        transaction_type: parsed_decrypted_data.transaction_type,
                        patient_id: patient_id || "",
                        physician_id: physician_id || "",
                        account_id: user_account.account_id,
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)(),
                    }
                });
                // notification sent to the patient or physician
                const notification = yield prisma_1.default.notification.create({
                    data: {
                        appointment_id: null,
                        patient_id: (new_transaction === null || new_transaction === void 0 ? void 0 : new_transaction.patient_id) || null,
                        physician_id: (new_transaction === null || new_transaction === void 0 ? void 0 : new_transaction.physician_id) || null,
                        notification_type: "Transaction",
                        notification_for_patient: patient_id ? true : false,
                        notification_for_physician: physician_id ? true : false,
                        transaction_id: new_transaction.transaction_id,
                        status: "completed",
                        case_note_id: null,
                        created_at: (0, currrentDateTime_1.default)(),
                        updated_at: (0, currrentDateTime_1.default)(),
                    }
                });
                const user_id = new_transaction.patient_id ? new_transaction.patient_id : (new_transaction.physician_id ? new_transaction.physician_id : null);
                if (notification && user_id != null) {
                    index_1.io.emit(`notification-${user_id}`, {
                        statusCode: 200,
                        notificationData: notification,
                    });
                }
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
                const patient_id = user.patient_id || null;
                const physician_id = user.physician_id || null;
                // getting patient account
                if (patient_id != null) {
                    const patient_account = yield prisma_1.default.account.findFirst({
                        where: {
                            patient_id
                        }
                    });
                    if (!patient_account) {
                        return res.status(404).json({ err: `User doesn't have an account yet.` });
                    }
                    return res.status(200).json({ msg: 'Patient Account', patient_account });
                }
                // getting physician account
                else if (physician_id != null) {
                    const physician_account = yield prisma_1.default.account.findFirst({
                        where: {
                            physician_id
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
            const { page_number } = req.params;
            try {
                let user_id = '';
                if (user.patient_id) {
                    user_id = user.patient_id;
                    const patient_account = yield prisma_1.default.account.findFirst({
                        where: {
                            patient_id: user_id,
                        }
                    });
                    if (!patient_account) {
                        return res.status(404).json({ err: `User doesn't have an account yet.` });
                    }
                    const [number_of_transactions, patient_transaction] = yield Promise.all([
                        prisma_1.default.transaction.count({
                            where: {
                                account_id: patient_account.account_id,
                            }
                        }),
                        prisma_1.default.transaction.findMany({
                            where: {
                                account_id: patient_account.account_id
                            },
                            skip: (Number(page_number) - 1) * 15,
                            take: 15,
                            orderBy: {
                                created_at: 'desc'
                            }
                        })
                    ]);
                    const number_of_pages = (number_of_transactions <= 15) ? 1 : Math.ceil(number_of_transactions / 15);
                    return res.status(200).json({ message: 'Transactions', data: { total_number_of_transactions: number_of_transactions, total_number_of_pages: number_of_pages, transactions: patient_transaction } });
                }
                else if (user.physician_id) {
                    user_id = user.physician_id;
                    const physician_account = yield prisma_1.default.account.findFirst({
                        where: {
                            physician_id: user_id
                        }
                    });
                    if (!physician_account) {
                        return res.status(404).json({ err: `User doesn't have an account yet.` });
                    }
                    const [number_of_transactions, physician_transaction] = yield Promise.all([
                        prisma_1.default.transaction.count({
                            where: {
                                account_id: physician_account.account_id,
                            }
                        }),
                        prisma_1.default.transaction.findMany({
                            where: {
                                account_id: physician_account.account_id
                            },
                            skip: (Number(page_number) - 1) * 15,
                            take: 15,
                            orderBy: {
                                created_at: 'desc'
                            }
                        })
                    ]);
                    const number_of_pages = (number_of_transactions <= 15) ? 1 : Math.ceil(number_of_transactions / 15);
                    return res.status(200).json({ message: 'Transactions', data: { total_number_of_transactions: number_of_transactions, total_number_of_pages: number_of_pages, transactions: physician_transaction } });
                }
            }
            catch (err) {
                console.log('Error getting patient account ', err);
                return res.status(500).json({ error: 'Error getting patient account ', err });
            }
        });
        this.filterAccountTransaction = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const user = req.account_holder.user;
            try {
                const { transaction_type, page_number } = req.params;
                if (!transaction_type || !['credit', 'debit'].includes(transaction_type)) {
                    return res.status(400).json({ err: "Transaction type should be one of ['debit', 'credit']" });
                }
                let user_id = '';
                if (user.patient_id) {
                    user_id = user.patient_id;
                    const patient_account = yield prisma_1.default.account.findFirst({
                        where: {
                            patient_id: user_id,
                        }
                    });
                    if (!patient_account) {
                        return res.status(404).json({ err: `User doesn't have an account yet.` });
                    }
                    const [number_of_transactions, patient_transaction] = yield Promise.all([
                        prisma_1.default.transaction.count({
                            where: {
                                account_id: patient_account.account_id, transaction_type
                            }
                        }),
                        prisma_1.default.transaction.findMany({
                            where: {
                                account_id: patient_account.account_id, transaction_type
                            },
                            skip: (Number(page_number) - 1) * 15,
                            take: 15,
                            orderBy: {
                                created_at: 'desc'
                            }
                        })
                    ]);
                    const number_of_pages = (number_of_transactions <= 15) ? 1 : Math.ceil(number_of_transactions / 15);
                    return res.status(200).json({ message: 'Transactions', data: { total_number_of_transactions: number_of_transactions, total_number_of_pages: number_of_pages, transactions: patient_transaction } });
                }
                else if (user.physician_id) {
                    user_id = user.physician_id;
                    const physician_account = yield prisma_1.default.account.findFirst({
                        where: {
                            physician_id: user_id
                        }
                    });
                    if (!physician_account) {
                        return res.status(404).json({ err: `User doesn't have an account yet.` });
                    }
                    const [number_of_transactions, physician_transaction] = yield Promise.all([
                        prisma_1.default.transaction.count({
                            where: {
                                account_id: physician_account.account_id, transaction_type
                            }
                        }),
                        prisma_1.default.transaction.findMany({
                            where: {
                                account_id: physician_account.account_id, transaction_type
                            },
                            skip: (Number(page_number) - 1) * 15,
                            take: 15,
                            orderBy: {
                                created_at: 'desc'
                            }
                        })
                    ]);
                    const number_of_pages = (number_of_transactions <= 15) ? 1 : Math.ceil(number_of_transactions / 15);
                    return res.status(200).json({ message: 'Transactions', data: { total_number_of_transactions: number_of_transactions, total_number_of_pages: number_of_pages, transactions: physician_transaction } });
                }
            }
            catch (err) {
                console.log('Error getting patient account ', err);
                return res.status(500).json({ error: 'Error getting patient account. ', err });
            }
        });
    }
}
exports.default = new Account;
//# sourceMappingURL=userAccount.js.map