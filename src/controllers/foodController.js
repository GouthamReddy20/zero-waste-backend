
import db from "../config/db.js";

export const addFood = async (req, res) => {
  try {
    const { name, quantity, location } = req.body;
    const userId = req.user.id;

    if (!name || !quantity) return res.status(400).json({ message: "Food name and quantity are required" });

    const [result] = await db.query
(
      "INSERT INTO food (name, quantity, location, userId) VALUES (?, ?, ?, ?)",
      [name, quantity, location || "", userId]
    );

    res.status(201).json({ message: "Food added successfully", foodId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getAllFood = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM food");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};
