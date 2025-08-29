const mongoose = require('mongoose');

const TenantDomainFactory = (mongoconnection: any) => {
    var TenantDomains = new mongoose.Schema({
        domain_name: { type: String, required: true },
        description: { type: String, required: false },
        tenant_name: { type: String, required: true },
        type: { type: Number, required: true },
        is_deleted: { type: Boolean, default: false },
        mapdomain: { type: Object, default: {} },
        subdmain: { type: Object, default: [] },
        status: { type: Number, default: 0 },
        is_active: { type: Boolean, default: false },
        tenant_type: { type: String, default: 'Platform' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
        company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'companies', required: true },
    }, { timestamps: true })
    return mongoconnection.model('tenant_domains', TenantDomains);
}

export default TenantDomainFactory
