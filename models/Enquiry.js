const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
  },
  { _id: false },
);

const enquirySchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, maxlength: 180 },
    location: { type: String, required: true, trim: true, maxlength: 250 },
    propertyType: { type: String, trim: true, maxlength: 120 },
    service: { type: String, trim: true, maxlength: 160 },
    budget: { type: String, trim: true, maxlength: 120 },
    startDate: { type: String, trim: true, maxlength: 80 },
    details: { type: String, trim: true, maxlength: 5000 },
    contactMethod: {
      type: String,
      enum: ["Phone", "WhatsApp", "Email"],
      default: "Phone",
    },
    agreedToContact: { type: Boolean, required: true },
    source: {
      type: String,
      enum: ["contact-form", "hero-booking"],
      default: "contact-form",
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
      select: false,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Enquiry", enquirySchema);
