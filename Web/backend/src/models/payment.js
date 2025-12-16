const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        paymentMethod: {
            type: String,
            default: "BANK_TRANSFER",
        },
        transactions: [
            {
                imageUrls: {
                    type: String,
                    required: true,
                },
                status: {
                    type: String,
                    enum: ["PENDING", "APPROVED", "REJECTED"],
                    default: "PENDING",
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

paymentSchema.virtual("status").get(function () {
    if (this.transactions.every((t) => t.status === "REJECTED")) return "REJECTED";
    if (this.transactions.some((t) => t.status === "APPROVED")) return "APPROVED";
    return "PENDING";
});

module.exports = mongoose.model("Payment", paymentSchema);
