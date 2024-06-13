
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi'

class ChatValidation {

    endMeetingSessionValid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const schema = Joi.object({
                roomId: Joi.string().trim().required(),
                sessionId: Joi.string().trim().required()
            })
            const { error: validation_error } = schema.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(422).json({ err: error_message });
            }
            return next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error durring end meeting session fields validation.' })
        }
    }

    removeParticipantValid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const schema = Joi.object({
                participantId: Joi.string().trim().required(),
                roomId: Joi.string().trim().required(),
                sessionId: Joi.string().trim().required()
            })
            const { error: validation_error } = schema.validate(req.body)

            if (validation_error) {
                const error_message = validation_error.message.replace(/"/g, '');
                return res.status(422).json({ err: error_message });
            }
            return next()
        } catch (err) {
            console.log(err)
            return res.status(422).json({ err: 'Error durring participant removal fields validation.' })
        }
    }
}

export default new ChatValidation