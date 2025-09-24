const mongoose = require('mongoose');

const UsersFactory = (mongoconnection: any) => {
    var Users = new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: false },
        is_deleted: { type: Boolean, default: false },
        is_active: { type: Boolean, default: true },
        is_verify: { type: Boolean, default: false },

        first_name: { type: String },
        last_name: { type: String },
        gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
        nationality: { type: String },
        marital_status: { type: String },
        city: { type: String },
        state: { type: String },
        mobile_number: { type: String },
        passport_number: { type: String },
        passport_country: { type: String },
        pan_number: { type: String },
        profile_img: { type: String },
    }, { timestamps: true })
    return mongoconnection.model('users', Users);
}

export default UsersFactory

