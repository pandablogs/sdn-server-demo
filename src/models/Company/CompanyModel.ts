const mongoose = require('mongoose');
const CompanyFactory = (mongoconnection: any) => {
    var company = new mongoose.Schema({
        company_name: { type: String, required: true },
        company_title: { type: String, default: "" },
        email: { type: String, required: true },
        full_name: { type: String, required: true },
        hostname: { type: String, required: true, },
        emailDomain: { type: String, required: true, },
        is_tenant: { type: Boolean, required: true, },
        is_active: { type: Boolean, required: true, },
        is_deleted: { type: Boolean, required: false, },
        request_status: { type: Number, required: true },
        requestedBy: { type: Number, default: 2 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
        createdAt: { type: Date, required: true },
        updatedAt: { type: Date, required: true },
        configuration: { type: Object, required: true },
        account_id: { type: String, default: null },
        company_logo: { type: String, default: "" },
        company_favicon: { type: String, default: "" },
        mobile_number: { type: String, default: "" },
        address: { type: String, default: "" },
        country: { type: String, default: "" },
        country_code: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        zip_code: { type: String, default: "" },
        lastLoginAt: { type: String, default: "" },
        dashboard_app_version: { type: String, default: "" },
        tenant_type: { type: String, default: 'Platform' },
        allow_user_chat: { type: String, default: 'disable' },
        studio_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
        personal_tokens: { type: Object, required: false, default: [] },
        system_variable : { type: Object, required: false, default: null },
        landing_page_info: { type: Object, required: false, default: { is_active: false, default_landing_page: "" } },
    })
    return mongoconnection.model('companies', company);
}

export default CompanyFactory


