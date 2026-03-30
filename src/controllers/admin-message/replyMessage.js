const Message = require("../../models/Message");
const sendEmail = require("../../utils/sendEmail");

const replyMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ success: false, message: "Reply message is required" });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.status === "Replied") {
      return res.status(400).json({ success: false, message: "Message has already been replied to" });
    }

    // Set reply fields
    message.reply = reply;
    message.status = "Replied";
    message.replyDate = new Date();

    await message.save();

    // Send email to user
    await sendEmail({
      email: message.email,
      subject: `Response to your inquiry: ${message.subject}`,
      message: `Hello ${message.name},\n\nThank you for reaching out.\n\nHere is our response to your message:\n${reply}\n\nBest Regards,\nCeramico Team`,
    });

    res.status(200).json({ success: true, message: "Reply sent successfully", data: message });
  } catch (error) {
    console.error("Error replying to message:", error);
    res.status(500).json({ success: false, message: "Failed to send reply. Please try again later." });
  }
};

module.exports = replyMessage;
