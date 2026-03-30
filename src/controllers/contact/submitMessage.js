const Message = require("../../models/Message");

const submitMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Please fill in all fields." });
    }

    const newMessage = new Message({
      name,
      email,
      subject,
      message,
    });

    await newMessage.save();

    res.status(201).json({ success: true, message: "Your message has been sent successfully." });
  } catch (error) {
    console.error("Error submitting message:", error);
    res.status(500).json({ success: false, message: "Failed to send message. Please try again later." });
  }
};

module.exports = submitMessage;
