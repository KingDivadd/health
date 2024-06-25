import { NextFunction , Request, Response} from 'express';
import webpush from 'web-push'
import apn from 'apn'
import convertedDatetime from '../helpers/currrentDateTime';
import { CustomRequest } from '../helpers/interface';
import prisma from '../helpers/prisma'

class Notification {

    saveSubscription = async (req: CustomRequest, res: Response, next: NextFunction) => {
        const { subscription } = req.body;
    
        try {
            const user = req.account_holder.user;
            const patient_id = user.patient_id || null;
            const physician_id = user.physician_id || null;
    
            // Check if the subscription already exists
            const existingSubscription = await prisma.subscription.findFirst({
                where: {
                    patient_id: patient_id || undefined,
                    physician_id: physician_id || undefined,
                    subscription
                }
            });
    
            if (existingSubscription) {
                return res.status(200).json({ msg: 'Subscription already exists', existingSubscription });
            }
    
    
            // Create a new subscription
            const newSubscription = await prisma.subscription.create({
                data: {
                    patient_id: patient_id || null,
                    physician_id: physician_id || null,
                    subscription,
                    created_at: convertedDatetime(),
                    updated_at: convertedDatetime(),
                },
            });
    
            return res.status(201).json({ msg: 'New subscription added', newSubscription });
        } catch (error) {
            console.error('Error saving subscription:', error);
            return res.status(500).json({ error: 'Error saving subscription' });
        }
    };

    webPushNotification = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {

            const { title, body, avatar, message, data } = req.pushNotificationData;
    
            const user = req.account_holder.user;
            const patient_id = user.patient_id || '';
            const physician_id = user.physician_id || '';
        
            // getting the subscription

            console.log('patient id => ',patient_id, 'physician id => ', physician_id)

            const userSubscription = await prisma.subscription.findFirst({
                where: {
                    patient_id: patient_id || undefined,
                    physician_id: physician_id || undefined,
                },
            });
            console.log('five');
    
            if (userSubscription) {
                const payloadData = {
                    title: title,
                    body: body,
                    icon: avatar || 'https://images.pexels.com/photos/5083013/pexels-photo-5083013.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
                };
    
                const payload = JSON.stringify(payloadData);
    
                try {
                    await webpush.sendNotification(JSON.parse(userSubscription.subscription), payload);
                    console.log('Push notification sent successfully.');
                } catch (err) {
                    console.error('Error sending notification:', err);
                    // Handle the error if needed, but don't send the response here
                }
            } else {
                return res.status(200).json({ msg: message, data, pushNotification: 'Receiver\'s subscription was not found.' });
            }
    
            // Send the response after attempting to send the push notification
            return res.status(200).json({ msg: message, data });
            
        } catch (err: any) {
            console.log('Error occurred during sending of web push notification, error:', err);
            return res.status(500).json({ err: 'Error occurred during sending of web push notification', error: err });
        }
    };
    
    socketWebPushNotification = async (user_id:string, user_data:any, title:string, body: string) => {
        try {

            // user data will contain the 1. callers avatar, 2. callers first and last_name
            // user data should contain 1. title, 2. avatar, 3. body (the message to be send the receiver), 4. 
            const { title, body, avatar, message, data } = user_data

            const userSubscription = await prisma.subscription.findFirst({
                where: {
                    patient_id: user_id,
                    physician_id: user_id,
                },
            });
    
            if (userSubscription) {
                const payloadData = {
                    title: title,
                    body: body,
                    icon: avatar || 'https://images.pexels.com/photos/5083013/pexels-photo-5083013.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
                };
    
                const payload = JSON.stringify(payloadData);
    
                try {

                    await webpush.sendNotification(JSON.parse(userSubscription.subscription), payload);
                    console.log('Push notification sent successfully.');

                } catch (err) {

                    console.error('Error sending notification:', err);
                    // Handle the error if needed, but don't send the response here
                }
            } else {
                return {statusCode: 404, message: `Receiver's subscription was not found`}
            }
    
            // Send the response after attempting to send the push notification
            return {statusCode: 200, message: `Push notification sent successfully`}
            
                
        } catch (err: any) {
            console.log('Error occurred during sending of web push notification, error:', err);

            return {statusCode: 500, message: 'Error occured during sending of push notification'}
        }
    };

    iosPushNotification = async(req: Request, res: Response, next: NextFunction)=>{
        try {
            const { deviceToken, alert, payload, topic} = req.body;

            // first set up the ios push notification
            const options = {
                token: {
                  key: "path/to/AuthKey_XXXXXXXXXX.p8", // Path to the .p8 file
                  keyId: "YOUR_KEY_ID", // The Key ID
                  teamId: "YOUR_TEAM_ID" // Your Team ID
                },
                production: false // Set to true if sending a notification to a production iOS app
                };
                
                const apnProvider = new apn.Provider(options);
            

            let notification = new apn.Notification();
            notification.alert = alert || "Hello Olatokumbo, this is a test notification";
            notification.payload = payload || { title: 'Greetings', message: "Where you come see light charge your pc", avatar: "http://david-pic.png"  };
            notification.topic = topic || "Hello Olatokumbo";

            apnProvider.send(notification, deviceToken)
                .then(result => {
                    res.json({ success: true, result });
                }).catch(err => {
                    console.error("Error sending notification:", err);
                    res.status(500).json({ success: false, error: err });
                });

            
        } catch (err:any) {
            console.log('Error occured during sending of ios push notification, error: ',err)
            return res.status(500).json({err: 'Error occured during sending of ios push notification',error: err})
        }
    }
}
export default new Notification