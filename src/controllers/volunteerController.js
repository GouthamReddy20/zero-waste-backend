// controllers/volunteerController.js
import db from "../config/db.js";

// -------------------- Notifications Helper ----------------
const createNotification = async (userId, message, donationId = null) => {
  try {
    await db.query(
      "INSERT INTO notifications (user_id, message, donation_id) VALUES (?, ?, ?)",
      [userId, message, donationId]
    );
  } catch (err) {
    console.error("Notification error:", err);
  }
};

// -------------------- GET VOLUNTEER PROFILE ----------------
export const getProfile = async (req, res) => {
  try {
    const volunteerId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, name, email, phone, address, role FROM users WHERE id=? AND role='volunteer'",
      [volunteerId]
    );
    if (!rows.length) return res.status(404).json({ message: "Volunteer not found" });

    const [first, ...rest] = rows[0].name.split(" ");
    const user = { ...rows[0], firstName: first, lastName: rest.join(" "), mobile: rows[0].phone };
    res.status(200).json({ user });
  } catch (err) {
    console.error("Get volunteer profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- UPDATE VOLUNTEER PROFILE ----------------
export const updateProfile = async (req, res) => {
  try {
    const volunteerId = req.user.id;
    const { firstName, lastName, mobile, address } = req.body;
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    await db.query(
      "UPDATE users SET name=?, phone=?, address=? WHERE id=? AND role='volunteer'",
      [fullName, mobile, address, volunteerId]
    );

    const [rows] = await db.query(
      "SELECT id, name, email, phone, address, role FROM users WHERE id=? AND role='volunteer'",
      [volunteerId]
    );
    const [first, ...rest] = rows[0].name.split(" ");
    const user = { ...rows[0], firstName: first, lastName: rest.join(" "), mobile: rows[0].phone };
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Update volunteer profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- GET DONATIONS ----------------
export const getDonations = async (req, res) => {
  try {
    const volunteerId = req.user.id;
    const [rows] = await db.query(
      `SELECT d.id, d.item_name AS itemName, d.quantity, d.location, d.freshness, d.pickup,
              d.status, d.created_at AS date, d.latitude AS lat, d.longitude AS lng,
              d.volunteer_id AS volunteerId,
              u.name AS donorName, u.id AS donorId,
              d.ngo_id AS ngoId
       FROM donations d
       JOIN users u ON d.donor_id = u.id
       WHERE d.status='Accepted by NGO'
          OR d.status='Accepted'
          OR (d.status='Completed' AND d.volunteer_id=?)
       ORDER BY d.created_at DESC`,
      [volunteerId]
    );

    res.status(200).json({ donations: rows });
  } catch (err) {
    console.error("Get donations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- ACCEPT DONATION ----------------
export const acceptDonation = async (req, res) => {
  try {
    const volunteerId = req.user.id;
    const donationId = req.params.id;

    const [donRows] = await db.query(
      "SELECT donor_id, ngo_id, item_name, status, volunteer_id FROM donations WHERE id=?",
      [donationId]
    );
    if (!donRows.length) return res.status(404).json({ message: "Donation not found" });

    const donation = donRows[0];
    if (donation.status !== "Accepted by NGO" && donation.status !== "Accepted")
      return res.status(400).json({ message: "Volunteer can only accept donations approved by NGO or unassigned" });

    if (donation.volunteer_id && donation.volunteer_id !== volunteerId)
      return res.status(400).json({ message: "Donation already assigned to another volunteer" });

    await db.query(
      "UPDATE donations SET status='Accepted', volunteer_id=? WHERE id=?",
      [volunteerId, donationId]
    );

    await createNotification(donation.donor_id, `Your donation "${donation.item_name}" has been accepted by a volunteer.`, donationId);
    if (donation.ngo_id)
      await createNotification(donation.ngo_id, `A volunteer accepted donation "${donation.item_name}".`, donationId);

    res.status(200).json({ message: "Donation accepted" });
  } catch (err) {
    console.error("Accept donation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- REJECT DONATION ----------------
export const rejectDonation = async (req, res) => {
  try {
    const donationId = req.params.id;

    const [donRows] = await db.query(
      "SELECT donor_id, ngo_id, item_name, status FROM donations WHERE id=?",
      [donationId]
    );
    if (!donRows.length) return res.status(404).json({ message: "Donation not found" });

    const donation = donRows[0];
    if (donation.status !== "Accepted by NGO" && donation.status !== "Accepted")
      return res.status(400).json({ message: "Volunteer can only reject donations approved by NGO or unassigned" });

    await db.query(
      "UPDATE donations SET volunteer_id=NULL, status='Accepted by NGO' WHERE id=?",
      [donationId]
    );

    await createNotification(donation.donor_id, `A volunteer rejected your donation "${donation.item_name}". It is back in the pool for others.`, donationId);
    if (donation.ngo_id)
      await createNotification(donation.ngo_id, `Volunteer rejected donation "${donation.item_name}".`, donationId);

    res.status(200).json({ message: "Donation rejected" });
  } catch (err) {
    console.error("Reject donation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- MARK COMPLETED ----------------
export const markCompleted = async (req, res) => {
  try {
    const volunteerId = req.user.id;
    const donationId = req.params.id;

    const [donRows] = await db.query(
      "SELECT donor_id, ngo_id, item_name FROM donations WHERE id=? AND volunteer_id=?",
      [donationId, volunteerId]
    );
    if (!donRows.length) return res.status(404).json({ message: "Donation not found or not assigned to you" });

    const donation = donRows[0];
    await db.query("UPDATE donations SET status='Completed' WHERE id=?", [donationId]);

    await createNotification(donation.donor_id, `Your donation "${donation.item_name}" has been successfully completed.`, donationId);
    if (donation.ngo_id)
      await createNotification(donation.ngo_id, `Donation "${donation.item_name}" has been completed.`, donationId);

    res.status(200).json({ message: "Donation marked as completed" });
  } catch (err) {
    console.error("Mark completed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- NOTIFICATIONS ----------------
export const getNotifications = async (req, res) => {
  try {
    const volunteerId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, message, is_read AS isRead, created_at AS created_at, donation_id AS donationId FROM notifications WHERE user_id=? ORDER BY created_at DESC",
      [volunteerId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const volunteerId = req.user.id;
    const notifId = req.params.id;
    await db.query("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?", [notifId, volunteerId]);
    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
