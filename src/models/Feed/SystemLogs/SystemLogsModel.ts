const mongoose = require('mongoose');

const SystemLogsFactory = (mongoconnection: any) => {
    const SystemLogsSchema = new mongoose.Schema({
        log_type: { type: Number, required: true },
        option_id: { type: Number, required: false },
        logs: { type: Object, required: true },
        appId: { type: mongoose.Schema.Types.ObjectId, required: false },
        moduleId: { type: mongoose.Schema.Types.ObjectId, required: false },
        parentId: { type: mongoose.Schema.Types.ObjectId, required: false },
        is_deleted: { type: Number, default: false },
        title: { type: String, required: false, default: "" },
        message: { type: String, required: false, default: "" },
    }, { timestamps: true })
    // Define indexes for frequently queried fields
    // SystemLogsSchema.index({ option_id: 1 });
    // SystemLogsSchema.index({ appId: 1 });
    // SystemLogsSchema.index({ is_deleted: 1 });
    // SystemLogsSchema.index({ createdAt: -1 });
    // SystemLogsSchema.index({ moduleId: 1 });
    // SystemLogsSchema.index({ title: "text", message: "text" });
    return mongoconnection.model('system_logs', SystemLogsSchema);
}

export default SystemLogsFactory


// Option_id
// (Option : 1 Password type, 2 Google, 3 Microsoft, 4 SAML, 5 pageLayout,  6 endpoint, 7 collection, 9 workflow)

//log_type
//1 SMAL login
//2 pageLayout 