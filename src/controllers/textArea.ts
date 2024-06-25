import { Request, Response, NextFunction } from 'express'
import prisma from '../helpers/prisma'
import chat from './chat'
import auth from '../helpers/auth'
import {redis_client} from '../helpers/prisma'
import { CustomRequest } from '../helpers/interface'
import { jwt_secret } from '../helpers/constants'
const jwt = require('jsonwebtoken')


const {changeUserAvailability} = chat
const {checkUserAvailability} = auth

class TestArea {
    getAvailability = async(req: Request, res: Response, next: NextFunction)=>{
        const {user_id} = req.body
        try {
            console.log(1)
            if (!user_id) {
                return res.status(404).json({ err: 'x-id-key is missing' })
            }
            const availability = await checkUserAvailability(user_id)
            console.log('availability => ',availability)
            return res.status(200).json({msg: availability?.message, date: availability?.value})
            // const decode_value = await jwt.verify(JSON.parse(value), jwt_secret)
            // res.send(decode_value)
        } catch (err:any) {
            console.log(err)
        }
    }

    changeAvail = async(req: Request, res: Response, next: NextFunction)=>{
        const {user_id} = req.body
        try {
            if (!user_id){
                return res.send('user id not ound')
            }
            const availability = await changeUserAvailability(user_id)
            return res.status(200).json({msg: availability.message, data: availability.value})
        } catch (err:any) {
            console.log(err)
        }
    }
}

export default new TestArea