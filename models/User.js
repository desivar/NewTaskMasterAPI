// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    googleId: { type: String, required: true, unique: true },
    // Add other user fields as needed
});

module.exports = mongoose.model('User', userSchema);