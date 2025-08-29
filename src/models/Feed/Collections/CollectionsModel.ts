const mongoose = require('mongoose');

const CollectionsFactory = (mongoconnection: any) => {
    var collections = new mongoose.Schema({
        title: { type: String, required: true },
        appId: { type: String, required: true, ref: 'apps' },
        collectionName: { type: String, required: true },
        collectionuuid: { type: String, required: true },
        collectionDescription: { type: String, required: true },
        externalAccess: { type: Boolean, default: false },
        otpContacts: { type: String, required: false },
        formschema: { type: String, required: true },
        viewTables: [{ type: Object }],
        eventsConfig: { type: Object, required: false },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        formType: { type: String, required: true },
        is_anonymous_form: { type: Boolean, default: false },
        createdTime: { type: Date, default: new Date() },
        modifiedTime: { type: Date, default: new Date() },
        permission: { type: Object, required: false },
        formLanguage: { type: Object, required: false },
        extSources: { type: Object, required: false },
        dataEventsConfig: { type: Object, default: [] },
        dataActionsConfig: { type: Object, default: [] },
        eventListenerConfig: { type: Object, default: [] },
        is_deleted: { type: Number, default: false },
        external_redirect_url: { type: String, default: "" },
        internal_redirect_url: { type: String, default: "" },
        last_publish_date: { type: String, default: "" },
        extAccessAuthentication: { type: Boolean, default: true },
        multipleSubmissions: { type: Boolean, default: true },
        enableEndPoint: { type: Boolean, default: false },
        endPoint: { type: Object, default: {} },
        relationModel: { type: Object, default: [] },
        is_include_data_publish: { type: Boolean, required: true, default: false },
        is_associate_custome_colection: { type: Boolean, required: false, default: false },
        is_display_language: { type: Boolean, required: true, default: false },
        isSideNav: { type: Boolean, default: false },
        selectedSidenavId: { type: String, required: false, default: "" },
        selectedAssociateCollection: { type: String, required: false, default: "" },
        jsEditor: { type: String, required: false, default: "" },
        cssEditor: { type: String, required: false, default: "" },
        pageLibrarys: { type: Object, default: [] },
        total_collection_recodes: { type: Number, default: 0 },
        parentCollectionId: { type: String, required: false }

    })
    return mongoconnection.model('collections', collections);
}
export default CollectionsFactory

