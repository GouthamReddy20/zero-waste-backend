import db from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// -------------------- Multer Setup --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

export const upload = multer({ storage });

// -------------------- Notification Helper --------------------
export const createNotification = async (userId, message) => {
  try {
    await db.query(
      "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
      [userId, message]
    );
  } catch (err) {
    console.error("Create notification error:", err);
  }
};

// -------------------- GET DONOR PROFILE --------------------
export const getDonorProfile = async (req, res) => {
  try {
    const donorId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, firstName, lastName, email, mobile, address, role FROM users WHERE id = ? AND role = 'donor'",
      [donorId]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Donor not found" });
    res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- UPDATE DONOR PROFILE --------------------
export const updateDonorProfile = async (req, res) => {
  try {
    const donorId = req.user.id;
    const { firstName, lastName, mobile, address } = req.body;

    await db.query(
      "UPDATE users SET firstName = ?, lastName = ?, mobile = ?, address = ? WHERE id = ? AND role = 'donor'",
      [firstName, lastName, mobile, address, donorId]
    );

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- CREATE DONATION --------------------
export const createDonation = async (req, res) => {
  try {
    const donorId = req.user.id;
    const { itemName, quantity, freshness, pickup, location, description, ngo } =
      req.body;
    const image = req.file?.filename || null;

    if (!itemName || !quantity || !pickup) {
      return res
        .status(400)
        .json({ message: "Item name, quantity, and pickup are required" });
    }

    const [result] = await db.query(
      `INSERT INTO donations 
      (donor_id, item_name, quantity, freshness, pickup, location, description, ngo_id, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        donorId,
        itemName,
        quantity,
        freshness || null,
        pickup,
        location || null,
        description || null,
        ngo || null,
        image,
      ]
    );

    const donationId = result.insertId;

    // -------------------- Notification: Donor --------------------
    await createNotification(
      donorId,
      `Donation "${itemName}" created successfully.`
    );

    // -------------------- Notifications: NGOs --------------------
    const [ngos] = await db.query("SELECT id FROM users WHERE role = 'ngo'");
    for (const n of ngos) {
      await createNotification(
        n.id,
        `New donation request from a donor: "${itemName}". Please review and accept if possible.`
      );
    }

    // -------------------- Notifications: Volunteers --------------------
    const [volunteers] = await db.query(
      "SELECT id FROM users WHERE role = 'volunteer'"
    );
    for (const v of volunteers) {
      await createNotification(
        v.id,
        `A new donation "${itemName}" may soon require pickup and delivery assistance.`
      );
    }

    // -------------------- Notifications: Admins --------------------
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (const a of admins) {
      await createNotification(
        a.id,
        `New donation "${itemName}" has been created by a donor.`
      );
    }

    res
      .status(201)
      .json({ message: "Donation created successfully", donationId });
  } catch (err) {
    console.error("Error creating donation:", err);
    res.status(500).json({ message: "Server error while creating donation" });
  }
};

// -------------------- GET DONATIONS --------------------
export const getDonations = async (req, res) => {
  try {
    const donorId = req.user.id;
    const [rows] = await db.query(
      `
      SELECT d.*, n.name AS ngo_name
      FROM donations d
      LEFT JOIN users n ON d.ngo_id = n.id
      WHERE d.donor_id = ?
      ORDER BY d.created_at DESC
    `,
      [donorId]
    );

    // Static NGO name mapping
    const ngoNames = {
      1: "Charity",
      2: "Poor People Center",
      3: "Orphanage",
      4: "Old Age Home",
    };

    const donations = rows.map((d) => ({
      id: d.id,
      itemName: d.item_name,
      quantity: d.quantity,
      freshness: d.freshness,
      pickup: d.pickup,
      location: d.location,
      description: d.description,
      ngoName: ngoNames[d.ngo_id] || d.ngo_name || "Any NGO",
      ngo_id: d.ngo_id,
      status: d.status,
      date: d.created_at,
      image: d.image,
    }));

    res.status(200).json(donations);
  } catch (err) {
    console.error("Get donations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- UPDATE DONATION STATUS --------------------
export const updateDonationStatus = async (req, res) => {
  try {
    const donorId = req.user.id;
    const donationId = req.params.id;
    const { status } = req.body;

    // Get donation info
    const [donationRows] = await db.query(
      "SELECT donor_id, item_name FROM donations WHERE id = ? AND donor_id = ?",
      [donationId, donorId]
    );
    if (!donationRows.length)
      return res.status(404).json({ message: "Donation not found" });
    const donation = donationRows[0];

    await db.query(
      "UPDATE donations SET status = ? WHERE id = ? AND donor_id = ?",
      [status, donationId, donorId]
    );

    // Notification to donor about status change
    await createNotification(
      donorId,
      `Your donation "${donation.item_name}" status changed to ${status}.`
    );

    res.status(200).json({ message: "Donation status updated successfully" });
  } catch (err) {
    console.error("Update donation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- DELETE DONATION --------------------
export const deleteDonation = async (req, res) => {
  try {
    const donorId = req.user.id;
    const donationId = req.params.id;

    await db.query("DELETE FROM donations WHERE id = ? AND donor_id = ?", [
      donationId,
      donorId,
    ]);

    res.status(200).json({ message: "Donation deleted successfully" });
  } catch (err) {
    console.error("Delete donation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- NOTIFICATIONS --------------------
export const getNotifications = async (req, res) => {
  try {
    const donorId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [donorId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const donorId = req.user.id;
    const notificationId = req.params.id;

    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [notificationId, donorId]
    );

    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Mark notification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- ADD DONATION (ALT) --------------------
export const addDonation = async (req, res) => {
  try {
    const donorId = req.user.id; // assuming auth middleware sets req.user
    const { itemName, quantity, location, freshness, pickup, ngoId } = req.body;

    // 1️⃣ Insert donation
    const [result] = await db.query(
      `INSERT INTO donations (donor_id, itemName, quantity, location, freshness, pickup, ngo_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [donorId, itemName, quantity, location, freshness, pickup, ngoId, "Pending"]
    );

    const donationId = result.insertId;

    // 2️⃣ Insert notification for donor
    const message = `Your donation "${itemName}" has been added successfully!`;
    await db.query(
      `INSERT INTO notifications (user_id, message, is_read, created_at)
       VALUES (?, ?, 0, NOW())`,
      [donorId, message]
    );

    res.status(201).json({ message: "Donation added successfully", donationId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
