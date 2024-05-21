import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { paystack_secret_key, } from '../helpers/constants';
import { CustomRequest } from '../helpers/interface';
import axios from 'axios';
import crypto from 'crypto'
import express from 'express'
import handleDecrypt, { handleEncrypt } from '../helpers/decryption';
import convertedDatetime from '../helpers/currrentDateTime';
const prisma = new PrismaClient()

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

        decryptData = async(req: CustomRequest, res: Response, next: NextFunction) => {
            const { encrypted_data } = req.body;
            try {   
                const decrypted_data:any = await handleDecrypt(encrypted_data);
                const parsed_decrypted_data:any = JSON.parse(decrypted_data)

                // first get user
                const patient = await prisma.account.findFirst({
                    where: {
                        patient_id: parsed_decrypted_data?.patient_id 
                    }
                })
                
                if (patient == null) {
                    return res.status(404).json({err: 'Patient not found'})
                }
                
                if (patient) {
                    const update_account = await prisma.account.update({
                        where: {
                            account_id: patient.account_id // Assuming account_id is unique
                        },
                        data: {
                            available_balance: {
                                increment: parsed_decrypted_data.amount/100,
                            }
                        }
                    });
                    
                }
                

                // now add to transaction table
                const new_transaction = await prisma.transaction.create({
                    data: {
                        amount: parsed_decrypted_data.amount/100,
                        account_id: patient.account_id,
                        created_at: convertedDatetime(),
                        updated_at: convertedDatetime(),
                    }
                })


                return res.status(200).json({ msg: 'Account updated successfully',  });
            } catch (error: any) {
                console.log("error during transaction initialization", error);
                return res.status(500).json({ err: 'Error during transaction initialization ', error: error });
            }
        }
        
        account = async(req: CustomRequest, res: Response, next: NextFunction)=>{
            const user = req.account_holder.user
            try {
                let user_id:string = '';
                if (user.patient_id){
                    user_id = user.patient_id
                    const patient_account = await prisma.account.findFirst({
                        where: {
                            patient_id: user_id
                        }
                    })
                    if (!patient_account){
                        return res.status(404).json({err: `User doesn't have an account yet.`})
                    }
                    return res.status(200).json({patient_account})
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
                return res.status(200).json({physician_account})
                }
            } catch (err:any) {
                console.log('Error getting patient account ',err)
                return res.status(500).json({error: 'Error getting patient account ',err})
            }
        }

        accountTransaction = async(req: CustomRequest, res: Response, next: NextFunction)=>{
            const user = req.account_holder.user
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
    
                    const patient_transaction:any =  await prisma.transaction.findMany({
                        where: {
                            account_id: patient_account.account_id
                        }
                    })
    
                    return res.status(200).json({nbHit: patient_transaction.length, patient_transactions: patient_transaction})
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
    
                    const physician_transaction:any =  await prisma.transaction.findMany({
                        where: {
                            account_id: physician_account.account_id
                        }
                    })
    
    
                    return res.status(200).json({nbHit: physician_transaction.length, physician_transactions: physician_transaction})
                }
                
            } catch (err:any) {
                console.log('Error getting patient account ',err)
                return res.status(500).json({error: 'Error getting patient account ',err})
            }
        }

    
}
export default new Account