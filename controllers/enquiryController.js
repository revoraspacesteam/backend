const Enquiry = require("../models/Enquiry");
const { Resend } = require("resend");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTIFICATION_EMAIL =
  process.env.ENQUIRY_NOTIFICATION_EMAIL || "revoraspacesteam@gmail.com";
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Revora Spaces <onboarding@resend.dev>";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function valueOrFallback(value) {
  return value || "Not provided";
}

async function sendEnquiryNotification(enquiry, files) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "Enquiry saved, but notification email was skipped: RESEND_API_KEY is not configured.",
    );
    return false;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const attachmentNames = files.map((file) => file.originalname).join(", ");
  const isBooking = enquiry.source === "hero-booking";
  const text = [
    isBooking
      ? "A new booking has been submitted through the Revora Spaces website."
      : "A new enquiry has been submitted through the Revora Spaces website.",
    "",
    "User details",
    `Name: ${valueOrFallback(enquiry.fullName)}`,
    `Phone: ${enquiry.phone}`,
    `Email: ${valueOrFallback(enquiry.email)}`,
    `Preferred contact method: ${enquiry.contactMethod}`,
    "",
    "Requirements",
    `Property location: ${enquiry.location}`,
    `Property type: ${valueOrFallback(enquiry.propertyType)}`,
    `Service required: ${valueOrFallback(enquiry.service)}`,
    `Budget: ${valueOrFallback(enquiry.budget)}`,
    `Preferred start date: ${valueOrFallback(enquiry.startDate)}`,
    `Details: ${valueOrFallback(enquiry.details)}`,
    `Attachments: ${valueOrFallback(attachmentNames)}`,
    "",
    `Enquiry ID: ${enquiry.id}`,
    `Received: ${enquiry.createdAt.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`,
  ].join("\n");

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [NOTIFICATION_EMAIL],
    subject: isBooking
      ? "New booking"
      : `New Revora enquiry from ${enquiry.fullName || enquiry.phone}`,
    text,
  });

  if (error) {
    throw new Error(error.message || "Resend could not send the notification.");
  }

  return true;
}

async function createEnquiry(req, res, next) {
  try {
    const phone = clean(req.body.phone);
    const location = clean(req.body.location);
    const email = clean(req.body.email);
    const source =
      clean(req.body.source) === "hero-booking"
        ? "hero-booking"
        : "contact-form";
    const agreedToContact = ["true", "on", "1"].includes(
      String(req.body.agree).toLowerCase(),
    );

    if (!phone || !location) {
      return res.status(400).json({
        message: "Phone number and property location are required.",
      });
    }

    if (
      source === "hero-booking" &&
      (!clean(req.body.fullName) || !clean(req.body.service))
    ) {
      return res.status(400).json({
        message: "Full name and service required are required.",
      });
    }

    if (!agreedToContact) {
      return res.status(400).json({
        message: "You must agree to be contacted before submitting.",
      });
    }

    if (email && !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const attachments = (req.files ?? []).map((file) => ({
      filename: file.originalname,
      contentType: file.mimetype,
      size: file.size,
      data: file.buffer,
    }));

    const enquiry = await Enquiry.create({
      fullName: clean(req.body.fullName),
      phone,
      email,
      location,
      propertyType: clean(req.body.propertyType),
      service: clean(req.body.service),
      budget: clean(req.body.budget),
      startDate: clean(req.body.startDate),
      details: clean(req.body.details),
      contactMethod: clean(req.body.contactMethod) || "Phone",
      agreedToContact,
      source,
      attachments,
    });

    let notificationSent = false;
    try {
      notificationSent = await sendEnquiryNotification(enquiry, req.files ?? []);
    } catch (error) {
      console.error("Failed to send enquiry notification:", error.message);
    }

    return res.status(201).json({
      message:
        source === "hero-booking"
          ? "Your booking request has been submitted successfully."
          : "Your enquiry has been submitted successfully.",
      enquiryId: enquiry.id,
      notificationSent,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createEnquiry };
