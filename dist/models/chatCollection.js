"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Define a nested schema for the media objects
const chatCollectionSchema = new mongoose_1.Schema({
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
const ChatModel = (0, mongoose_1.model)("Chat", chatCollectionSchema);
exports.default = ChatModel;
//# sourceMappingURL=chatCollection.js.map