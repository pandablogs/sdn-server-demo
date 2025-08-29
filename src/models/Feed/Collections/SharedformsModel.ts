const mongoose = require('mongoose');

const SharedformsFactory = (mongoconnection: any) => {
    var Sharedforms = new mongoose.Schema({
        collectionName: { type: String, required: true },
        collectionDescription: { type: String, required: true },
        externalAccess: { type: Boolean, default: false },
        otpContacts: { type: String, required: false },
        formschema: { type: String, required: true },
        viewTables: [{ type: Object }],
        eventsConfig: { type: Object, required: false },
        formType: { type: String, required: true },
        is_anonymous_form: { type: Boolean, default: false },
        permission: { type: Object, required: false },
        formLanguage: { type: Object, required: false },
	extSources: { type: Object, required: false },
        dataEventsConfig: { type: Object, default : [] },
        dataActionsConfig: { type: Object, default : [] },
        extAccessAuthentication: { type: Boolean, default: false },
        multipleSubmissions: { type: Boolean, default: true },
        external_redirect_url: { type: String, default: "" },
        internal_redirect_url: { type: String, default: "" },
        hostname: { type: String, required: false },
        isTenantCollection: { type: Number, default: false },
        parentCollectionId: { type: mongoose.Schema.Types.ObjectId, required: false },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        is_deleted: {  type: Number, default: false}
    }, { timestamps: true });

    Sharedforms.virtual('companies', {
        ref: 'companies',
        localField: 'hostname',
        foreignField: 'hostname'
    });

    return mongoconnection.model('sharedforms', Sharedforms);
}
export default SharedformsFactory

