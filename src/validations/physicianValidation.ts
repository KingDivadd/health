import { Request, Response, NextFunction } from 'express';
import Joi from 'joi'


class PhysicianValidation {


    physicianSignupValidation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validate_new_physician = Joi.object({
                last_name: Joi.string().trim().required(),
                first_name: Joi.string().trim().required(),
                other_names: Joi.string().trim().allow('').optional(),
                email: Joi.string().email().trim().required(),
                password: Joi.string().trim().required()
            })

            const { error: validation_error } = validate_new_physician.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (error) {
            return res.status(422).json({ err: 'Error during physician signup data validation' })
        }
    }

    physicianLoginValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const validate_physician_login = Joi.object({
                email: Joi.string().trim().required(),
                password: Joi.string().trim().required()
            })

            const { error: validation_error } = validate_physician_login.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            return res.status(422).json({ err: 'Error during physician signup data validation' })
        }
    }

    physicianSetupProfileValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const gender_enum = ['male', 'female']
            const registered_as = ['specialist', 'hospital', 'laboratory', 'pharmacy']
            const speciality = ['dentist', 'oncologist','neurologist', 'nutritionist', 'general_doctor', 'surgeon']

            const validate_physician_data = Joi.object({
                registered_as: Joi.string().trim().required(),
                speciality: Joi.string().trim().required(),
                gender: Joi.string().allow('').trim().valid(...gender_enum).required(),
                date_of_birth: Joi.string().trim().required(),
                country_code: Joi.string().trim().required(),
                phone_number: Joi.string().trim().required(),
                address: Joi.string().trim().required(),
                state: Joi.string().trim().required(),
                country: Joi.string().trim().required(),

                avatar: Joi.string().trim().allow('').optional(),
                medical_license: Joi.string().trim().allow('').optional(),
                cac_document: Joi.string().trim().allow('').optional(),
                professional_credentials: Joi.string().trim().allow('').optional(),
                verification_of_employment: Joi.string().trim().allow('').optional()
            });
            const { error: validation_error } = validate_physician_data.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during physician data update validation' })
        }
    }

    physicianDataValidation = (req: Request, res: Response, next: NextFunction) => {
        try {
            const gender_enum = ['male', 'female']
            const registered_as = ['specialist', 'hospital', 'laboratory', 'pharmacy']
            const speciality = ['dentist', 'oncologist','neurologist', 'nutritionist', 'general_doctor', 'surgeon']

            const validate_physician_data = Joi.object({
                registered_as: Joi.string().trim().required(),
                speciality: Joi.string().trim().required(),
                gender: Joi.string().allow('').trim().valid(...gender_enum).required(),
                date_of_birth: Joi.string().trim().allow().optional(),
                country_code: Joi.string().trim().allow('').optional(),
                phone_number: Joi.string().trim().allow('').optional(),
                bio: Joi.string().trim().allow('').optional(),
                address: Joi.string().trim().required(),
                state: Joi.string().trim().allow('').optional(),
                country: Joi.string().trim().allow('').optional(),
                
                avatar: Joi.string().trim().allow('').optional(),
                medical_license: Joi.string().trim().allow('').optional(),
                professional_credentials: Joi.string().trim().allow('').optional(),
                verification_of_employment: Joi.string().trim().allow('').optional()
            });
            const { error: validation_error } = validate_physician_data.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during physician data update validation' })
        }
    }

    filterPhysicianValidation = (req: Request, res: Response, next: NextFunction) => {
        try {

            const validate_physician_data = Joi.object({
                speciality: Joi.string().allow('').optional(),
            });
            const { error: validation_error } = validate_physician_data.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during filter physician data validation' })
        }
    }

    filterAppointmentValidation = (req: Request, res: Response, next: NextFunction)=> {
        try {
            const schema = Joi.object({
                status: Joi.string().trim().allow('').valid('pending','accepted', 'denied', 'cancelled').optional(),
            });
            const { error: validation_error } = schema.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            return next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error during filter physician data validation' })
        }
    }


    updateAppointmentValidation = (req: Request, res: Response, next: NextFunction)=>{
        try {
            const validate_appointment = Joi.object({
                appointment_id: Joi.string().trim().required(),
                status: Joi.string().trim().valid('accepted', 'denied').required()
            })
            const { error: validation_error } = validate_appointment.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err:any) {
            console.log(err)
            return res.status(422).json({ err: 'Error during accepting appoitment validation.' })
        }
    }

    cancelAppointmentValidation = (req: Request, res: Response, next: NextFunction)=>{
        try {
            const validate_appointment = Joi.object({
                appointment_id: Joi.string().trim().required(),
                status: Joi.string().trim().valid('cancelled').required()
            })
            const { error: validation_error } = validate_appointment.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err:any) {
            console.log(err)
            return res.status(422).json({ err: 'Error during accepting appoitment validation.' })
        }
    }

    createCaseNoteValid = (req: Request, res: Response, next: NextFunction)=>{
        try {
            const schema = Joi.object({
                appointment_id: Joi.string().trim().required(),
                patient_id: Joi.string().trim().required(),

                assessment_or_diagnosis: Joi.string().trim().allow(''), 
                current_medication: Joi.string().trim().allow(''), 
                examination_findings: Joi.string().trim().allow(''), 
                family_history: Joi.string().trim().allow(''), 
                history_of_presenting_complains: Joi.string().trim().allow(''),
                past_medical_history: Joi.string().trim().allow(''), 
                past_medication: Joi.string().trim().allow(''), 
                plan: Joi.string().trim().allow(''), 
                presenting_complaint: Joi.string().trim().allow(''), 
                review_of_system: Joi.string().trim().allow(''), 
                social_history: Joi.string().trim().allow(''),
                prescription: Joi.string().trim().allow(''),
                test: Joi.string().trim().allow('')


                })
            const { error: validation_error } = schema.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err:any) {
            console.log(err)
            return res.status(422).json({ err: 'Error during accepting appoitment validation.' })
        }
    }
    
    updateCaseNoteValid = (req: Request, res: Response, next: NextFunction)=>{
        try {
            const schema = Joi.object({
                assessment_or_diagnosis: Joi.string().trim().allow(''), 
                current_medication: Joi.string().trim().allow(''), 
                examination_findings: Joi.string().trim().allow(''), 
                family_history: Joi.string().trim().allow(''), 
                history_of_presenting_complains: Joi.string().trim().allow(''),
                past_medical_history: Joi.string().trim().allow(''), 
                past_medication: Joi.string().trim().allow(''), 
                plan: Joi.string().trim().allow(''), 
                presenting_complaint: Joi.string().trim().allow(''), 
                review_of_system: Joi.string().trim().allow(''), 
                social_history: Joi.string().trim().allow('')


                })
            const { error: validation_error } = schema.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(400).json({ err: error_message });
            }
            next()
        } catch (err:any) {
            console.log(err)
            return res.status(422).json({ err: 'Error during accepting appoitment validation.' })
        }
    }


}

export default new PhysicianValidation