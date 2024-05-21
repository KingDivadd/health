
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi'

class HelperValidation {
    genOtpValidation = async (req: Request, res: Response, next: NextFunction) => {
        const {email} = req.body
        try {
            const validate_otp_generation = Joi.object({
                email: Joi.string().trim().required()
            })
            const { error: validation_error } = validate_otp_generation.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(422).json({ err: error_message });
            }
            return next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error unique code generation validation.' })
        }
    }

    verifyOtpValidation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validate_otp_validation = Joi.object({
                email: Joi.string().trim().required(),
                otp: Joi.string().trim().required()
            })
            const { error: validation_error } = validate_otp_validation.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(422).json({ err: error_message });
            }
            return next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during unique code verification validation.' })
        }
    }

    passwordUpdateValidation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validate_password = Joi.object({
                new_password: Joi.string().trim().required()
            })
            const { error: validation_error } = validate_password.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(422).json({ err: error_message });
            }
            return next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during password update validation' })
        }
    }
   
    
}

export default new HelperValidation

export const chatValidation = async ( data:any) => {
    try {
        const schema = Joi.object({
            idempotency_key: Joi.string().trim().required(),
            appointment_id: Joi.string().trim().required(),
            physician_id: Joi.string().trim().required(),
            patient_id: Joi.string().trim().required(),
            is_physician: Joi.boolean().required(),
            is_patient: Joi.boolean().required(),
            text: Joi.string().allow('').optional(),
            token: Joi.string().required(),
            media: Joi.array()
        })
        
        
        const value = await schema.validateAsync({...data});

        return ({
            status: true,
            data: value,
            message: 'validated succesfully',
            statusCode: 401,
        });
        } catch (error:any) {
            console.log(error)
            return ({
            status: false,
            statusCode: 422,
            message: error.details[0].message,
            error: error.details[0].message,
        });
    }
}
