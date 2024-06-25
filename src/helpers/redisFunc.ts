import { v4 as uuidv4 } from 'uuid';
import gen_token from './generateToken';
import { redisDataProps, redisCallDataProps } from './interface';
import {redis_client} from './prisma'
import { jwt_secret } from './constants';
const jwt = require('jsonwebtoken')

class RedisFunc {

    redisCallStore = async (user_id: string, availability: any, useful_time: number) => {
        try {
            const uuid: string = uuidv4();
            const token = gen_token({ availability });
            await redis_client.set(`${user_id}`, JSON.stringify(token), 'EX', 3600);
            return user_id;
        } catch (err) {
            console.error('Error in redisAuthStore:', err);
            throw err;
        }
    }


    redisStore = async ({ user, life_time }: redisDataProps) => {
        try {
            const uuid: string = uuidv4();
            const token = gen_token({ user });
    
            if (life_time) {
                await redis_client.set(`${uuid}`, JSON.stringify(token), 'EX', life_time / 1000);
            } else {
                await redis_client.set(`${uuid}`, JSON.stringify(token));
            }
            
            return uuid;
        } catch (err) {
            console.error('Error in redisAuthStore:', err);
            throw err;
        }
    }

    redisSignupStore = async (user:any) => {
        try {
            const uuid: string = uuidv4();
            const token = gen_token({ user });
            await redis_client.set(`${uuid}`, JSON.stringify(token));
            return uuid;
        } catch (err) {
            console.error('Error in redisAuthStore:', err);
            throw err;
        }
    }

    redisAuthStore = async (user: any, useful_time: number) => {
        try {
            const uuid: string = uuidv4();
            const token = gen_token({ user });
            await redis_client.set(`${uuid}`, JSON.stringify(token), 'EX', useful_time);
            return uuid;
        } catch (err) {
            console.error('Error in redisAuthStore:', err);
            throw err;
        }
    }

    redisOtpStore = async (email: string, sent_otp: string, status: string, useful_time: number) => {
        try {
            const token = gen_token({ email, sent_otp, status })
            await redis_client.set(`${email}`, JSON.stringify(token), 'EX', useful_time)
        } catch (err) {
            console.error('Error in redisOtpStore:', err);
            throw err;
        }
    }

    redisOtpUpdate = async ( email: string, status: string) => {
        try {
            const token = gen_token({ email, status })
            await redis_client.set(`${email}`, JSON.stringify(token), 'EX', 60 * 60)
        } catch (err) {
            console.error('Error in redisOtpStore:', err);
            throw err;
        }
    }

    redisOtpVerificationStatus = async (status: string) => {
        try {
            const uuid: string = uuidv4();
            await redis_client.set(`${uuid}`, status)
            return uuid
        } catch (err: any) {
            console.error('Error in redisStore:', err);
            throw err;
        }
    }

    redisDataDelete = async (uuid: string) => {
        try {
            const remove_data = await redis_client.del(uuid);
            return remove_data
        } catch (err) {
            console.error('Error in redisDataDelete:', err);
            throw err;
        }
    }

    redisValueUpdate = async (uuid: string, user: any, useful_time: number) => {
        try {
            const data_exist = await redis_client.get(`${uuid}`)
            if (!data_exist) {
                this.redisAuthStore(user, useful_time)
            } else {
                const token = gen_token({ user });
                const update_redis = await redis_client.set(`${uuid}`, JSON.stringify(token), 'EX', useful_time)
                return uuid
            }
        } catch (err) {
            console.error('Error in redis data update : ', err);
            throw err;
        }
    }



}

export default new RedisFunc