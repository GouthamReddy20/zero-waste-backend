import db from "../config/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// -------------------- ADMIN LOGIN --------------------
export const adminLogin = async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;

    if (!email || !password || !secretKey) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid Admin Secret Key" });
    }

    const [userRows] = await db.query(
      "SELECT * FROM users WHERE email=? AND role='admin'",
      [email]
    );

    if (!userRows.length) return res.status(404).json({ message: "Admin not found" });

    const admin = userRows[0];
    if (admin.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone || "-",
        address: admin.address || "-"
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- GET ADMIN PROFILE --------------------
export const getProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, name, email, phone, address, role FROM users WHERE id=? AND role='admin'",
      [adminId]
    );

    if (!rows.length) return res.status(404).json({ message: "Admin not found" });

    const user = rows[0];
    user.phone = user.phone || "-";
    user.address = user.address || "-";

    res.status(200).json({ user });
  } catch (err) {
    console.error("Admin profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- UPDATE ADMIN PROFILE --------------------
export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, phone, address } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required" });
    }

    await db.query(
      "UPDATE users SET name=?, phone=?, address=? WHERE id=? AND role='admin'",
      [name, phone || null, address || null, adminId]
    );

    const [rows] = await db.query(
      "SELECT id, name, email, phone, address, role FROM users WHERE id=?",
      [adminId]
    );

    const user = rows[0];
    user.phone = user.phone || "-";
    user.address = user.address || "-";

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Update admin profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- GET ALL VOLUNTEERS --------------------
export const getVolunteers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, address, status, created_at, role FROM users WHERE role='volunteer' ORDER BY created_at DESC"
    );

    const volunteers = rows.map(v => ({
      ...v,
      phone: v.phone || "-",
      address: v.address || "-",
      registeredAt: v.created_at
    }));

    res.status(200).json({ volunteers });
  } catch (err) {
    console.error("Get volunteers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- UPDATE VOLUNTEER --------------------
export const updateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    if (!name && !status) return res.status(400).json({ message: "Missing name or status" });

    const fields = [];
    const values = [];

    if (name) { fields.push("name=?"); values.push(name); }
    if (status) { fields.push("status=?"); values.push(status); }

    values.push(id);

    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id=? AND role='volunteer'`, values);
    res.status(200).json({ message: "Volunteer updated successfully" });
  } catch (err) {
    console.error("Update volunteer error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// -------------------- GET ALL NGOS --------------------
export const getNGOs = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, address, status, ngo_type, created_at FROM users WHERE role='ngo' ORDER BY created_at DESC"
    );

    const ngos = rows.map(n => ({
      ...n,
      phone: n.phone || "-",
      address: n.address || "-",
      ngo_type: n.ngo_type || "-",
      registeredAt: n.created_at
    }));

    res.status(200).json({ ngos });
  } catch (err) {
    console.error("Get NGOs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- UPDATE NGO --------------------
export const updateNGO = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    if (!name && !status) return res.status(400).json({ message: "Missing name or status" });

    const fields = [];
    const values = [];

    if (name) { fields.push("name=?"); values.push(name); }
    if (status) { fields.push("status=?"); values.push(status); }

    values.push(id);

    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id=? AND role='ngo'`, values);
    res.status(200).json({ message: "NGO updated successfully" });
  } catch (err) {
    console.error("Update NGO error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// -------------------- GET ALL DONATIONS --------------------
export const getAllDonations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        d.id, d.item_name, d.quantity, d.status, d.location, d.created_at,
        d.freshness, d.pickup, d.serves, d.description, d.image,
        COALESCE(donor.name,'-') AS donorName,
        COALESCE(ngo.name,'-') AS ngoName,
        COALESCE(vol.name,'-') AS volunteerName,
        COALESCE(donor.phone,'-') AS donorPhone,
        COALESCE(donor.address,'-') AS donorAddress
      FROM donations d
      LEFT JOIN users donor ON d.donor_id = donor.id
      LEFT JOIN users ngo ON d.ngo_id = ngo.id
      LEFT JOIN users vol ON d.volunteer_id = vol.id
      ORDER BY d.created_at DESC
    `);

    res.status(200).json({ donations: rows });
  } catch (err) {
    console.error("Get donations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- UPDATE DONATION STATUS --------------------
export const updateDonationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) return res.status(400).json({ message: "Missing donation ID or status" });

    await db.query("UPDATE donations SET status=? WHERE id=?", [status, id]);
    res.status(200).json({ message: "Donation status updated successfully" });
  } catch (err) {
    console.error("Update donation status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- GET CONTACTS --------------------
export const getAllContacts = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, message, DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') as created_at FROM contacts ORDER BY created_at DESC"
    );
    res.status(200).json({ contacts: rows });
  } catch (err) {
    console.error("Get contacts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- GET NOTIFICATIONS --------------------
export const getAllNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, message, IFNULL(is_read,0) as is_read, DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') as created_at FROM notifications ORDER BY created_at DESC"
    );
    res.status(200).json({ notifications: rows });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- DASHBOARD STATS --------------------
export const getDashboardStats = async (req, res) => {
  try {
    const [[donations]] = await db.query("SELECT COUNT(*) AS total FROM donations");
    const [[volunteers]] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role='volunteer'");
    const [[ngos]] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role='ngo'");
    const [[contacts]] = await db.query("SELECT COUNT(*) AS total FROM contacts");
    const [[notifications]] = await db.query("SELECT COUNT(*) AS total FROM notifications");

    res.status(200).json({
      donations: donations.total,
      volunteers: volunteers.total,
      ngos: ngos.total,
      contacts: contacts.total,
      notifications: notifications.total
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- MARK NOTIFICATION READ --------------------
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Notification ID is required" });

    await db.query("UPDATE notifications SET is_read=1 WHERE id=?", [id]);

    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
