const mongoose = require('mongoose');

export default function refreshTokensFactory(mongoconnection: any) {

    var refreshTokens = new mongoose.Schema({
        refresh_token: { type: String, required: true },
        expires: { type: Date, required: true },
        OAuthClient: { type: mongoose.Schema.Types.ObjectId, ref: 'oauthclients'},
        User: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
        is_deleted: { type: Boolean, default: false },
        createAt: { type: Boolean, default: false },
        scope: { type: String,},
    }, {
        timestamps: true
    })

    return mongoconnection.model('refreshtokens', refreshTokens);
}

