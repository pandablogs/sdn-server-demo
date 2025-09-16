const mongoose = require('mongoose');

const StockFactory = (mongoconnection: any) => {
    var Stocks = new mongoose.Schema({

        stock_name: { type: String, required: true },
        rate: { type: String, required: true },
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'customer' }

    }, { timestamps: true })
    return mongoconnection.model('stocks', Stocks);
}

export default StockFactory;

