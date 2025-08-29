const mongoose = require("mongoose");

const SystemLogsFactory = async (mongoconnection: any) => {
    const db = mongoconnection.db;
    const collections = await db.listCollections({ name: "logs" }).toArray();
    if (collections.length === 0) {
        console.log("Creating capped 'logs' collection (500MB, max 50K docs)...");
        await db.createCollection("logs", {
            capped: true,
            size: 500 * 1024 * 1024, // 500 MB
            max: 50000
        });
    } else if (collections.length > 0) {
        const info = collections[0].options || {}; // Exists → check if capped
        if (!info.capped) {
            await db.createCollection("logs", {
                capped: true,
                size: 500 * 1024 * 1024, // 500 MB
                max: 50000
            });
        } else {
            console.log("Logs collection already exists and is capped.");
        }
    }

    const SystemLogs = new mongoose.Schema(
        {
            id: { type: String, default: "" },
            appId: { type: String, default: "" }, //Hidden
            optionId: { type: Number, default: 0 },//Hidden
            moduleId: { type: String, default: "" },//Hidden
            userId: { type: String, default: "" },//Hidden
            app_name: { type: String, default: "" },
            module_type: { type: String, default: "" },
            module_name: { type: String, default: "" },
            log_data: { type: Object, default: {} },
            message: { type: String },
            actionID: { type: String, default: "" },
            level: { type: String, required: true },
            tenant: { type: String },
            metadata: { type: Object, default: {} },
            logDetails: { type: String, default: "" },
            startDate: { type: String, default: "" },
            endDate: { type: String, default: "" },
            status: { type: String, default: "" },
            status_code: { type: Number, default: 0 },
            enableLogs: { type: Boolean, default: false },
            isStreamLog: { type: Boolean, required: true },
            createdAt: { type: Date, default: Date.now },
            is_deleted: { type: Number, default: false }
        },
        {
            timestamps: true
        }
    );
    // Define indexes for frequently queried fields
    SystemLogs.index({ appId: 1 });
    SystemLogs.index({ isStreamLog: 1 });
    SystemLogs.index({ optionId: 1 });
    SystemLogs.index({ createdAt: -1 });
    SystemLogs.index({ moduleId: 1 });

    return mongoconnection.model("logs", SystemLogs);
};

export default SystemLogsFactory;

// (Option : 1 pageLayout,  2 endpoint, 3 collection, 4 workflow, 5 Schedule, 6 system )
// (ModuleName :  endpoint name , collection name,

//Schedule
//job: { type: String, required: true },
// title: { type: String, required: true },
// jobLogs: { type: String, default: "" },
// startDate: { type: String, required: false },
// startTime: { type: String, required: false },