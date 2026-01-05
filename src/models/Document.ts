import mongoose, { Schema, model, models } from 'mongoose';

const DocumentSchema = new Schema({
  content: { type: String, required: true },
  metadata: { type: Map, of: String },
  embedding: { type: [Number], required: true },
}, { timestamps: true });

const Document = models.Document || model('Document', DocumentSchema);

export default Document;
