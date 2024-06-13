import { NextFunction , Request, Response} from 'express';
import webpush from 'web-push'
import apn from 'apn'

class Notification {
    webPushNotification = async(req: Request, res: Response, next: NextFunction)=>{
        const { subscription, url, title, body, avatar } = req.body;
        try {
            console.log('Subscription:', subscription);
            
            const payloadData = {
                title: title,
                body: body,
                icon: avatar || 'https://images.pexels.com/photos/5083013/pexels-photo-5083013.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
                url: url
            };

            const payload = JSON.stringify(payloadData);

            webpush.sendNotification(subscription, payload)
                .then(() => {
                    console.log('Push notification sent successfully.');
                    res.status(201).json({ data: payloadData, test: 'teting', body: body });
                })
                .catch(err => {
                    console.error('Error sending notification:', err);
                    res.status(500).json({ error: 'Error sending notification' });
                });
        } catch (err:any) {
            console.log('Error occured during sending of web push notification, error: ',err)
            return res.status(500).json({err: 'Error occured during sending of web push notification',error: err})
        }
    }

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