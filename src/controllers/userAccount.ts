import { Request, Response, NextFunction } from 'express'
import { CustomRequest } from '../helpers/interface';
import handleDecrypt, { handleEncrypt } from '../helpers/decryption';
import convertedDatetime from '../helpers/currrentDateTime';
import {io} from "../index"
import prisma from '../helpers/prisma'

class Account {

        encryptData = async(req: Request, res: Response, next: NextFunction)=>{
            const {patient_id, amount} = req.body
            try {   
                const encrypt_data_string = await handleEncrypt(JSON.stringify(req.body))
                return res.status(200).json({msg:'Encrypted successfully', encrypt_data_string})
            } catch (error:any) {
                console.log("error during transaction initialization", error)
                return res.status(500).json({err: 'Error during transaction initialization ',error: error})
            }
        }

        decryptDepositData = async(req: CustomRequest, res: Response, next: NextFunction) => {
            const { encrypted_data } = req.body;
            try {   

                const decrypted_data:any = await handleDecrypt(encrypted_data);
                const parsed_decrypted_data:any = JSON.parse(decrypted_data)


                // first get user
                let patient_id = '';
                let physician_id = '';

                if (parsed_decrypted_data?.patient_id){
                    patient_id = parsed_decrypted_data?.patient_id
                }else if (parsed_decrypted_data?.physician_id){
                    physician_id = parsed_decrypted_data?.physician_id
                }

                const user_account = await prisma.account.findFirst({
                    where: {
                        patient_id: patient_id,
                        physician_id: physician_id,
                    }
                })

                
                if (user_account == null) {
                    return res.status(404).json({err: 'User not found'})
                }
                
                if (user_account) {
                    if (parsed_decrypted_data.transaction_type.toLowerCase() === 'credit'){
                        
                        const update_account = await prisma.account.update({
                            where: {
                                account_id: user_account.account_id
                            },
                            data: {
                                available_balance: {
                                    increment: parsed_decrypted_data.amount/100,
                                }
                            }
                        });
                        
                    }else{
                        return res.status(400).json({err: 'Invalid deposit trnsaction type.'})
                    }
                    
                }
                

                // now add to transaction table
                const new_transaction = await prisma.transaction.create({
                    data: {
                        amount: parsed_decrypted_data.amount/100,
                        transaction_type: parsed_decrypted_data.transaction_type,
                        patient_id: patient_id || "",
                        physician_id: physician_id || "",
                        account_id: user_account.account_id,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                })

                // the notification sent to the patient
                const notification = await prisma.notification.create({
                    data: {
                        appointment_id: null,
                        patient_id: new_transaction?.patient_id || null,
                        physician_id: new_transaction?.physician_id || null, 
                        notification_type: "Transaction",
                        notification_for_patient: true,
                        transaction_id: new_transaction.transaction_id ,
                        status: "completed",
                        case_note_id: null,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                })

                if (notification){
                    io.emit(`notification-${new_transaction.patient_id}`, {
                        statusCode: 200,
                        notificationData: notification,
                    })
                }


                return res.status(200).json({ msg: 'Account updated successfully',  });
            } catch (error: any) {
                console.log("error during transaction initialization", error);
                return res.status(500).json({ err: 'Error during transaction initialization ', error: error });
            }
        }
        
        decryptWithdrawalData = async(req: CustomRequest, res: Response, next: NextFunction) => {
            const { encrypted_data } = req.body;
            try {   
                const decrypted_data:any = await handleDecrypt(encrypted_data);
                const parsed_decrypted_data:any = JSON.parse(decrypted_data)

                // first get user
                let patient_id = '';
                let physician_id = '';

                if (parsed_decrypted_data?.patient_id){
                    patient_id = parsed_decrypted_data?.patient_id
                }else if (parsed_decrypted_data?.physician_id){
                    physician_id = parsed_decrypted_data?.physician_id
                }

                const user_account = await prisma.account.findFirst({
                    where: {
                        patient_id: patient_id,
                        physician_id: physician_id,
                    }
                })
                
                if (user_account == null) {
                    return res.status(404).json({err: 'User not found'})
                }
                
                if (user_account) {
                    if ( parsed_decrypted_data.transaction_type.toLowerCase() === 'debit' ){
                        if ( (user_account.available_balance -  ( parsed_decrypted_data.amount / 100 )) < 0 ){
                            return res.status(400).json({err: 'You cannot withdraw an amount greater than you available balance'})
                        }

                        const update_account = await prisma.account.update({
                            where: {
                                account_id: user_account.account_id
                            },
                            data: {
                                available_balance: {
                                    decrement: parsed_decrypted_data.amount/100,
                                }
                            }
                        });
                    }else{
                        return res.status(400).json({err: 'Invalid withdrawal transaction type. should be debit.'})
                    }
                    
                }
                

                // adding the transaction data
                const new_transaction = await prisma.transaction.create({
                    data: {
                        amount: parsed_decrypted_data.amount/100,
                        transaction_type: parsed_decrypted_data.transaction_type,
                        patient_id: patient_id || "",
                        physician_id: physician_id || "",
                        account_id: user_account.account_id,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                })

                // notification sent to the patient or physician
                const notification = await prisma.notification.create({
                    data: {
                        appointment_id: null,
                        patient_id: new_transaction?.patient_id || null,
                        physician_id: new_transaction?.physician_id || null, 
                        notification_type: "Transaction",
                        notification_for_patient: patient_id ? true: false ,
                        notification_for_physician: physician_id ? true: false,
                        transaction_id: new_transaction.transaction_id,
                        status: "completed",
                        case_note_id: null,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                })

                const user_id = new_transaction.patient_id ? new_transaction.patient_id : (new_transaction.physician_id ?  new_transaction.physician_id : null)

                if (notification && user_id != null){
                    io.emit(`notification-${user_id}`, {
                        statusCode: 200,
                        notificationData: notification,
                    })
                }


                return res.status(200).json({ msg: 'Account updated successfully',  });
            } catch (error: any) {
                console.log("error during transaction initialization", error);
                return res.status(500).json({ err: 'Error during transaction initialization ', error: error });
            }
        }
        
        account = async(req: CustomRequest, res: Response, next: NextFunction)=>{
            const user = req.account_holder.user
            try {
                const patient_id = user.patient_id || null
                const physician_id = user.physician_id || null

                // getting patient account
                if (patient_id != null){
                    const patient_account = await prisma.account.findFirst({
                        where: {
                            patient_id
                        }
                    })
                    if (!patient_account){
                        return res.status(404).json({err: `User doesn't have an account yet.`})
                    }

                    return res.status(200).json({msg: 'Patient Account', patient_account})

                }

                // getting physician account
                else if (physician_id != null){

                    const physician_account = await prisma.account.findFirst({
                    where: {
                        physician_id
                    }
                })

                if (!physician_account){
                    return res.status(404).json({err: `User doesn't have an account yet.`})
                }

                return res.status(200).json({physician_account})
                }
            } catch (err:any) {
                console.log('Error getting patient account ',err)
                return res.status(500).json({error: 'Error getting patient account ',err})
            }
        }

        accountTransaction = async(req: CustomRequest, res: Response, next: NextFunction)=>{
            const user = req.account_holder.user
            const {page_number} = req.params
            try {
                let user_id:string = '';
                if (user.patient_id){
                    user_id = user.patient_id
                    const patient_account = await prisma.account.findFirst({
                        where: {
                            patient_id:user_id,
                        }
                    })
    
                    if (!patient_account){
                        return res.status(404).json({err: `User doesn't have an account yet.`})
                    }

                    const [number_of_transactions, patient_transaction] = await Promise.all([
                        prisma.transaction.count({
                            where: {
                                account_id: patient_account.account_id,
                            }
                        }),
                        
                        prisma.transaction.findMany({
                            where: {
                                account_id: patient_account.account_id
                            },
        
                            skip: (Number(page_number) - 1) * 15,
        
                            take: 15,
        
                            orderBy: {
                                created_at: 'desc'
                            }
                            
                        })
                    ])
    
    
                    const number_of_pages = (number_of_transactions <= 15) ? 1 : Math.ceil(number_of_transactions/15)

                    return res.status(200).json({ message:'Transactions', data: {total_number_of_transactions: number_of_transactions, total_number_of_pages: number_of_pages, transactions: patient_transaction} })
                    
                }
                else if (user.physician_id){
                    user_id = user.physician_id
                    const physician_account = await prisma.account.findFirst({
                        where: {
                            physician_id: user_id
                        }
                    })
    
                    if (!physician_account){
                        return res.status(404).json({err: `User doesn't have an account yet.`})
                    }
    
                    const [number_of_transactions, physician_transaction] = await Promise.all([
                        prisma.transaction.count({
                            where: {
                                account_id: physician_account.account_id,
                            }
                        }),
                        
                        prisma.transaction.findMany({
                            where: {
                                account_id: physician_account.account_id
                            },
        
                            skip: (Number(page_number) - 1) * 15,
        
                            take: 15,
        
                            orderBy: {
                                created_at: 'desc'
                            }
                            
                        })
                    ])
    
                    const number_of_pages = (number_of_transactions <= 15) ? 1 : Math.ceil(number_of_transactions/15)

                    return res.status(200).json({ message:'Transactions', data: {total_number_of_transactions: number_of_transactions, total_number_of_pages: number_of_pages, transactions: physician_transaction} })
                }
                
            } catch (err:any) {
                console.log('Error getting patient account ',err)
                return res.status(500).json({error: 'Error getting patient account ',err})
            }
        }

        filterAccountTransaction = async(req: CustomRequest, res: Response, next: NextFunction)=>{
            const user = req.account_holder.user
            try {
                const {transaction_type, page_number} = req.params
                if (!transaction_type || !['credit', 'debit'].includes(transaction_type)){
                    return res.status(400).json({err: "Transaction type should be one of ['debit', 'credit']"})
                }

                let user_id:string = '';
                if (user.patient_id){
                    user_id = user.patient_id
                    const patient_account = await prisma.account.findFirst({
                        where: {
                            patient_id:user_id,
                        }
                    })
    
                    if (!patient_account){
                        return res.status(404).json({err: `User doesn't have an account yet.`})
                    }
    
                    const [number_of_transactions, patient_transaction] = await Promise.all([
                        prisma.transaction.count({
                            where: {
                                account_id: patient_account.account_id, transaction_type
                            }
                        }),
                        
                        prisma.transaction.findMany({
                            where: {
                                account_id: patient_account.account_id, transaction_type
                            },
        
                            skip: (Number(page_number) - 1) * 15,
        
                            take: 15,
        
                            orderBy: {
                                created_at: 'desc'
                            }
                            
                        })
                    ])
    
    
                    const number_of_pages = (number_of_transactions <= 15) ? 1 : Math.ceil(number_of_transactions/15)

                    return res.status(200).json({ message:'Transactions', data: {total_number_of_transactions: number_of_transactions, total_number_of_pages: number_of_pages, transactions: patient_transaction} })
                }
                else if (user.physician_id){
                    user_id = user.physician_id
                    const physician_account = await prisma.account.findFirst({
                        where: {
                            physician_id: user_id
                        }
                    })
    
                    if (!physician_account){
                        return res.status(404).json({err: `User doesn't have an account yet.`})
                    }
    
                    const [number_of_transactions, physician_transaction] = await Promise.all([
                        prisma.transaction.count({
                            where: {
                                account_id: physician_account.account_id, transaction_type
                            }
                        }),
                        
                        prisma.transaction.findMany({
                            where: {
                                account_id: physician_account.account_id, transaction_type
                            },
        
                            skip: (Number(page_number) - 1) * 15,
        
                            take: 15,
        
                            orderBy: {
                                created_at: 'desc'
                            }
                            
                        })
                    ])
    
    
                    const number_of_pages = (number_of_transactions <= 15) ? 1 : Math.ceil(number_of_transactions/15)

                    return res.status(200).json({ message:'Transactions', data: {total_number_of_transactions: number_of_transactions, total_number_of_pages: number_of_pages, transactions: physician_transaction} })
                }
                
            } catch (err:any) {
                console.log('Error getting patient account ',err)
                return res.status(500).json({error: 'Error getting patient account. ',err})
            }
        }

    
}
export default new Account