const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true },
  completed: { type: Boolean, default: false }, // Renamed from isCompleted for consistency
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Correctly reference the User model
    required: true
  },
  dueDate: { type: Date },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  tags: { type: [String], default: [] }, // Added the 'tags' field

  // Removed 'status', 'createdAt', 'updatedAt', 'category', 'isCompleted'
  // You can add 'createdAt' and 'updatedAt' automatically with timestamps: true below
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);