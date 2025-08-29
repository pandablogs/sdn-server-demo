const mongoose = require('mongoose');
export default function OauthClientsFactory(mongoconnection: any) {
    var OauthClients = new mongoose.Schema({
        application_name: { type: String, required: true },
        token_expired: { type: String, required: false },
        client_id: { type: String, required: true, },
        client_secret: { type: String, required: true, },
        redirect_uri: { type: String, required: false, default: "" },
        homepage_url: { type: String, required: false, default: "" },
        app_description: { type: String, required: false, default: "" },
        is_deleted: { type: Number, required: false, default: 0 },
    })
    return mongoconnection.model('oauthclients', OauthClients);
}

