const mongoose = require('mongoose');

const CollectionFormsFactory = (mongoconnection: any, collection_form?: any) => {
    if (collection_form) {
        var CollectionForms = new mongoose.Schema({}, { strict: false })
        return mongoconnection.model(collection_form, CollectionForms, collection_form);
    } else {
        return false
    }
}


export default CollectionFormsFactory

