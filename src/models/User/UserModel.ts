const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    confirm_password: { type: String },
    is_deleted: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_verify: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
