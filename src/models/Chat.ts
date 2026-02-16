import mongoose, { Schema, Model, Document } from 'mongoose';

export interface MultipartContent {
    type: string;
    [key: string]: unknown;
}

export type MessageContent = string | MultipartContent[];

export interface IMessage {
    id: string;
    role: 'user' | 'assistant';
    content: MessageContent; // Can be string or multipart array
    createdAt: Date;
}

export interface IChat extends Document {
    userId: string;
    title: string;
    messages: IMessage[];
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema({
    id: { type: String, required: true },
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ChatSchema = new Schema<IChat>({
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Chat' },
    messages: [MessageSchema],
    isPinned: { type: Boolean, default: false },
}, {
    timestamps: true
});

// Create index for fetching sorted chats
ChatSchema.index({ userId: 1, isPinned: -1, createdAt: -1 });

// Prevent overwrite during hot reloading
const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
