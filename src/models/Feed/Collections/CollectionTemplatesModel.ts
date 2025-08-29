const mongoose = require('mongoose');

const CollectionTemplatesFactory = (mongoconnection: any) => {
    var CollectionTemplates = new mongoose.Schema({
        file_name: { type: String, required: true },
        is_online: { type: Boolean, required: true, default : true },
        description: { type: String, required: true },
        formschema: { type: String, required: true },
        viewTables: { type: Object, required: true },
        formLanguage: { type: Object, required: true },
	extSources: { type: Object, required: false },
        dataEventsConfig: { type: Object, default : [] },
        dataActionsConfig: { type: Object, default : [] },
        createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
        createdTime: { type: String, default: new Date().toISOString() },
        modifiedTime: { type: String, default: new Date().toISOString() },
        is_deleted: { type: Boolean, default: false }
    })
    return mongoconnection.model('collectiontemplates', CollectionTemplates);
}

export default CollectionTemplatesFactory

