const mongoose = require('mongoose');

const SharedformSubmissionsFactory = (mongoconnection: any) => {
    var SharedformSubmissions = new mongoose.Schema({
        SharedformId: { type: mongoose.Schema.Types.ObjectId, ref: 'sharedforms', required: true },
        parentCollectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        submissionsData: { type: String, required: false },
        status: { type: Number, default: 0 },
        createdBy: { type: String, required: false },
        modifiedBy: { type: String, required: false },
        is_deleted: { type: Number, default: false }
    }, { timestamps: true });
    return mongoconnection.model('sharedformsubmissions', SharedformSubmissions);
}
export default SharedformSubmissionsFactory

