import { Schema, model, Types } from "mongoose";
import { ChatInterface } from "../helpers/interface";
import { v4 as uuidv4 } from 'uuid';

// Define a nested schema for the media objects


const chatCollectionSchema = new Schema<ChatInterface>({
    idempotency_key: { type: String, required: true },
    appointment_id: { type: String, required: true },
    text: { type: String, },
    media: { type: [], default: [] },
    physician_id: { type: String, required: true },
    patient_id: { type: String, required: true },
    is_patient: { type: Boolean, default: false },
    is_physician: { type: Boolean, default: false },
    date: { type: Number, default: Date.now() },
    
}, { timestamps: true });

const ChatModel = model<ChatInterface>("Chat", chatCollectionSchema);
export default ChatModel;
