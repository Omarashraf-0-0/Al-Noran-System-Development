const mongoose = require('mongoose');

const notifictaionsSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        category : {
            type : String,
            enum : ["client_document_uploaded","shipment_approval","customer_registration"] , // todo check this again im not sure if this all the needed
            required : true,
        },
        uploadedDocumentUrl: {
            type : String,
            ref : "Upload"
        },
        shipmentCode : {
            type : String,
            ref : "shipment"
        },
        documentUploaderId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },
        registeredClient:{
            type : mongoose.Schema.Types.ObjectId,
            ref : "user",
        },
        content : {
            type : String,
            // required : true,
        },
        isRead : {
            type : Boolean,
            default : false
        },
    },
    { timestamps:true }
)

notifictaionsSchema.pre('validate' , function (next){

    if(category === 'client_document_uploaded' && !this.uploadedDocumentUrl)
    {
        return next(new Error("documentUrl is required for document category"));
    }

    if(category === "shipment_approval" && !this.shipmentCode)
    {
        return next(new Error("shipmentNumber is required for shipment category"));
    }

    if(this.category === "registeredClient" && !this.registeredClient) {
        return next(new Error("registeredEmail is required for registration category"));
    }

    next();
})


module.exports = mongoose.model("Notification",notifictaionsSchema);