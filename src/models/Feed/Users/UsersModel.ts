const mongoose = require('mongoose');

const UsersFactory = (mongoconnection: any) => {
    var Users = new mongoose.Schema({
        user_name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: false },
        is_deleted: { type: Boolean, default: false },
        is_active: { type: Boolean, default: true },
        is_verify: { type: Boolean, default: false }
    })
    return mongoconnection.model('users', Users);
}

export default UsersFactory


//Platform - Access Studio and Live
//Solution - Access on Live
//Studio - Access on Stduio
//Live - Access on Live

