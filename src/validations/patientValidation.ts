import { Request, Response, NextFunction } from 'express';
import Joi from 'joi'


class PatientValidation {
    patientSignupValidation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validate_new_patient = Joi.object({
                last_name: Joi.string().trim().required(),
                first_name: Joi.string().trim().required(),
                other_names: Joi.string().trim().allow('').optional(),
                email: Joi.string().trim().email().required(),
                password: Joi.string().trim().required()
            })

            const { error: validation_error } = validate_new_patient.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            return res.status(422).json({ err: 'Error during patient signup data validation.' })
        }
    }

    patientUpdateCompletionValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const gender_enum = ['male', 'female']
            const validate_patient_data = Joi.object({
                gender: Joi.string().trim().valid(...gender_enum).required(),
                date_of_birth: Joi.string().trim().required(),
                country_code: Joi.string().trim().required(),
                phone_number: Joi.string().trim().required(),
                referral_code: Joi.string().trim().allow('').optional(),
            });
            const { error: validation_error } = validate_patient_data.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during patient data update validation.' })
        }
    }

    patientOrgProfileCompletionValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const validate_patient_data = Joi.object({
                organization_name: Joi.string().trim().required(),
                organization_type: Joi.string().trim().allow('').optional(),
                position_held: Joi.string().trim().required(),
                organization_size: Joi.number().required(),
                company_website_link: Joi.string().trim().allow("").optional(),
                phone_number: Joi.string().trim().required(),
                address: Joi.string().trim().required(),
                country: Joi.string().trim().allow('').optional(),
                country_code: Joi.string().trim().required(),
                cac_document: Joi.string().trim().required(),
                registration_document: Joi.string().trim().required(),
                referral_code: Joi.string().trim().allow('').optional()
            });
            const { error: validation_error } = validate_patient_data.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during patient data update validation.' })
        }
    }

    patientLoginValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const validate_patient_login = Joi.object({
                email: Joi.string().trim().required(),
                password: Joi.string().trim().required()
            })

            const { error: validation_error } = validate_patient_login.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            return res.status(422).json({ err: 'Error during patient login data validation.' })
        }
    }

    patientEditValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const gender_enum = ['male', 'female']
            const validate_patient_data = Joi.object({                
                gender: Joi.string().allow('').trim().valid(...gender_enum).optional(),
                blood_group: Joi.string().trim().allow('').optional(),
                genotype: Joi.string().trim().allow('').optional(),
                avatar: Joi.string().trim().allow('').optional(),
                country: Joi.string().trim().allow('').optional(),
                state: Joi.string().trim().allow('').optional(),
                country_code: Joi.string().trim().allow('').optional(),
                phone_number: Joi.string().trim().allow('').optional(),
            });
            const { error: validation_error } = validate_patient_data.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during patient data update validation.' })
        }
    }

    
    encryptedDataValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const validate_encrypted_data = Joi.object({                
                encrypted_data: Joi.string().trim().required(),
            });
            const { error: validation_error } = validate_encrypted_data.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during data encryption validation.' })
        }
    }

    bookAppointmentValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const mode_of_consult_enum = ['physical', 'virtual']
            const appointment_type_enum = ['chat', 'video_call']
            const schema = Joi.object({                
                physician_id: Joi.string().trim().required(), 
                mode_of_consult: Joi.string().valid('virtual', 'physical').required(),
                appointment_type: Joi.when('mode_of_consult', {
                    is: 'virtual',
                    then: Joi.string().valid('chat', 'video_call').required(),
                    otherwise: Joi.forbidden()
                }),
                complain: Joi.string().trim().required(),
                time: Joi.number().required()
            });
            const { error: validation_error } = schema.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during book appoitment validation.' })
        }
    }

    filterNotificationValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const schema = Joi.object({                
                status: Joi.string().trim().valid('pending', 'completed', 'cancelled', 'accepted').required(), 
                
            });
            const { error: validation_error } = schema.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during filtering notification validation.' })
        }
    }

    

    

}

export default new PatientValidation