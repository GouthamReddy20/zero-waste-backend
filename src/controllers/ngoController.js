import db from "../config/db.js";

// ✅ Helper to create notifications
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

// -------------------- GET NGO PROFILE --------------------
export const getProfile = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const [rows] = await db.query(
      `SELECT id, name, email, phone AS mobile, address, role, ngo_type, avatar
       FROM users WHERE id = ? AND role = 'ngo'`,
      [ngoId]
    );

    if (!rows.length) return res.status(404).json({ message: "NGO not found" });

    const [firstName, ...lastArr] = (rows[0].name || "").split(" ");
    const lastName = lastArr.join(" ");

    res.status(200).json({
      user: { ...rows[0], firstName, lastName },
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- UPDATE NGO PROFILE --------------------
export const updateProfile = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const { firstName, lastName, mobile, address, ngo_type } = req.body;

    if (!firstName)
      return res.status(400).json({ message: "First name is required" });

    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    await db.query(
      "UPDATE users SET name=?, phone=?, address=?, ngo_type=? WHERE id=? AND role='ngo'",
      [fullName, mobile || null, address || null, ngo_type || null, ngoId]
    );

    const [updatedRows] = await db.query(
      `SELECT id, name, email, phone AS mobile, address, role, ngo_type, avatar
       FROM users WHERE id=? AND role='ngo'`,
      [ngoId]
    );

    const [fName, ...lArr] = (updatedRows[0].name || "").split(" ");
    const lName = lArr.join(" ");

    res.status(200).json({
      message: "Profile updated successfully",
      user: { ...updatedRows[0], firstName: fName, lastName: lName },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};

// -------------------- GET DONATIONS --------------------
export const getDonations = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const [rows] = await db.query(
      `SELECT d.id, d.item_name AS itemName, d.quantity, d.location, d.freshness, d.pickup, 
              d.status, d.created_at AS date, d.latitude AS lat, d.longitude AS lng,
              u.name AS donorName, u.id AS donorId
       FROM donations d
       JOIN users u ON d.donor_id = u.id
       WHERE d.ngo_id=? OR d.status='Pending'
       ORDER BY d.created_at DESC`,
      [ngoId]
    );
    res.status(200).json({ donations: rows });
  } catch (err) {
    console.error("Get donations error:", err);
    res.status(500).json({ message: "Server error while fetching donations" });
  }
};

// -------------------- ACCEPT DONATION --------------------
export const acceptDonation = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const donationId = req.params.id;

    const [donRows] = await db.query(
      "SELECT donor_id, item_name, ngo_id FROM donations WHERE id=?",
      [donationId]
    );
    if (!donRows.length)
      return res.status(404).json({ message: "Donation not found" });

    const donation = donRows[0];

    if (donation.ngo_id && donation.ngo_id !== ngoId)
      return res.status(403).json({ message: "You cannot accept this donation" });

    await db.query(
      "UPDATE donations SET status='Accepted', ngo_id=? WHERE id=?",
      [ngoId, donationId]
    );

    // Notifications
    await createNotification(
      donation.donor_id,
      `Your donation "${donation.item_name}" was accepted by the NGO.`,
      donationId
    );
    await createNotification(
      ngoId,
      `You accepted the donation "${donation.item_name}" successfully.`,
      donationId
    );

    res.status(200).json({ message: "Donation accepted successfully" });
  } catch (err) {
    console.error("Accept donation error:", err);
    res.status(500).json({ message: "Failed to accept donation", error: err.message });
  }
};

// -------------------- REJECT DONATION --------------------
export const rejectDonation = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const donationId = req.params.id;

    const [donRows] = await db.query(
      "SELECT donor_id, item_name, ngo_id FROM donations WHERE id=?",
      [donationId]
    );
    if (!donRows.length)
      return res.status(404).json({ message: "Donation not found" });

    const donation = donRows[0];

    if (donation.ngo_id && donation.ngo_id !== ngoId)
      return res.status(403).json({ message: "You cannot reject this donation" });

    await db.query("UPDATE donations SET status='Rejected' WHERE id=?", [donationId]);

    // Notifications
    await createNotification(
      donation.donor_id,
      `Your donation "${donation.item_name}" was rejected by the NGO.`,
      donationId
    );
    await createNotification(
      ngoId,
      `You rejected the donation "${donation.item_name}".`,
      donationId
    );

    res.status(200).json({ message: "Donation rejected successfully" });
  } catch (err) {
    console.error("Reject donation error:", err);
    res.status(500).json({ message: "Failed to reject donation", error: err.message });
  }
};

// -------------------- MARK DONATION AS DELIVERED --------------------
export const markDonationDelivered = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const donationId = req.params.id;

    const [donRows] = await db.query(
      "SELECT donor_id, item_name, ngo_id, status FROM donations WHERE id=?",
      [donationId]
    );
    if (!donRows.length) return res.status(404).json({ message: "Donation not found" });

    const donation = donRows[0];

    if (donation.ngo_id !== ngoId)
      return res.status(403).json({ message: "You cannot deliver this donation" });

    if (donation.status !== "Accepted")
      return res.status(400).json({ message: "Only accepted donations can be marked delivered" });

    await db.query("UPDATE donations SET status='Completed' WHERE id=?", [donationId]);

    // Notify donor
    await createNotification(
      donation.donor_id,
      `Your donation "${donation.item_name}" has been successfully delivered.`,
      donationId
    );

    res.status(200).json({ message: "Donation marked as delivered successfully" });
  } catch (err) {
    console.error("Mark delivered error:", err);
    res.status(500).json({ message: "Failed to mark donation as delivered", error: err.message });
  }
};

// -------------------- NOTIFICATIONS --------------------
export const getNotifications = async (req, res) => {
  try {
    const ngoId = req.user.id;
    const [rows] = await db.query(
      "SELECT id, message, is_read AS isRead, created_at AS date, donation_id AS donationId FROM notifications WHERE user_id=? ORDER BY created_at DESC",
      [ngoId]
    );
    res.status(200).json({ notifications: rows });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Server error while fetching notifications" });
  }
};

export const readNotification = async (req, res) => {
  try {
    const notifId = req.params.id;
    await db.query("UPDATE notifications SET is_read=1 WHERE id=?", [notifId]);
    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Read notification error:", err);
    res.status(500).json({ message: "Server error while marking notification" });
  }
};
