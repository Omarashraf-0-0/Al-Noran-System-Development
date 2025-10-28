const mongoose = require('mongoose');

const acidRequestSchema = new mongoose.Schema({
  // ✅ بيانات المورد (فاتورة مبدئية)
  supplier: {
    name: { type: String, required: true },
    taxNum: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true },
    mobileNum: { type: String, required: true },
  },

  // ✅ بيانات البضاعة
  goods: {
    description: { type: String, required: true },  // وصف البضاعة
    weight: { type: Number, required: true },       // الوزن المبدئي
    customsItem: { type: String, required: true },  // بند جمركي (غير أساسي)
  },

  // ✅ بيانات الطلب العامة
  requestDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Pending", "ACID Issued", "Rejected"],
    default: "Pending",
  },
  acidCode: { type: String, default: null },

});

module.exports = mongoose.model("AcidRequest", acidRequestSchema);
