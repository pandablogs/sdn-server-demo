const mongoose = require('mongoose');

const CustomerFactory = (mongoconnection: any) => {
    var Customer = new mongoose.Schema({
        name: { type: String, required: true },
        location: { type: String },
        stockId: { type: mongoose.Schema.Types.ObjectId, ref: "stocks" },

    }, { timestamps: true })
    return mongoconnection.model('customer', Customer);
}

export default CustomerFactory;

