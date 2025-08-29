const mongoose = require('mongoose');

export default function OauthScopesFactory(mongoconnection: any) {

    var OauthScopes = new mongoose.Schema({
        scope: { type: String, required: true },
        is_default: { type: Boolean, required: true , default: true,  },
    })

    return mongoconnection.model('oauthscopes', OauthScopes);
}

