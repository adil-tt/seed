const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Unread", "Replied"],
      default: "Unread",
    },
    reply: {
      type: String,
    },
    replyDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
