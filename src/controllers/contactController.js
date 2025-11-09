import db from "../config/db.js"; // Keep this import — not pool

export const addContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Use db.query (not pool)
    const [result] = await db.query(
      "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
      [name, email, message]
    );

    res.status(201).json({
      message: "Message sent successfully",
      contactId: result.insertId,
    });
  } catch (err) {
    console.error("❌ Contact form error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message || err,
    });
  }
};
