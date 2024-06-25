    import { NextFunction, Request, Response } from "express";
    import express from "express";
    import crypto from "crypto";
    import axios from 'axios';
    import bodyParser from "body-parser";
    import { videosdk_api_key } from '../helpers/constants';

    const router = express.Router();
    router.use(bodyParser.json());

    // Verify Signature Middleware
    class RegisterWebhook {
        verifySignature = (req: Request, res: Response, next: NextFunction) => {
            console.log(1)
            const signature = req.headers['videosdk-signature'] as string;
            const body = req.body;
            if (!req.body) {
                return res.status(400).send('Request body is missing or empty');
            }
            if (!signature) {
                return res.status(400).send('Signature is missing or empty');
            }
            
            
            if (!videosdk_api_key){
                throw new Error("Video skd publick key not found");
                
            }
            console.log(2)
            
            const isVerified = crypto.verify(
                'RSA-SHA256',
                Buffer.from(JSON.stringify(body)),
                {
                    key: videosdk_api_key,
                    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                },
                Buffer.from(signature, 'base64')
            );
            
            console.log(3)
            if (isVerified) {
                console.log(4)
                next();
            } else {
                res.status(401).send('Invalid signature');
            }
        };

        // webhook handler
        sendWebhook = (req: Request, res: Response) => {
            const data = req.body;
            console.log(5)
            // Handle the specific webhook event here
            console.log('Webhook received:', data);
        
            res.status(200).send('Webhook received');
        };

        // funtion to register webhook
        registerWebhook = async () => {
            try {
                // const response = await axios.post('https://api.videosdk.example.com/webhooks', {
                // url: 'https://your-server.com/api/videosdk/webhook', // Adjust the URL to your actual endpoint
                // event: 'user-joined', // Example event
                // }, {
                // headers: {
                //     'Authorization': `Bearer ${videosdk_api_key}` // Assuming you need to authorize the request
                // }
                // });
                // console.log('Webhook registration response:', response.data);
            } catch (error) {
                console.error('Error registering webhook:', error);
            }
        };
        

    }

    export default new RegisterWebhook
