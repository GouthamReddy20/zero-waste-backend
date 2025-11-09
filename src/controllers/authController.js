import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

// Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, role, adminKey, ngo_type } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (role === 'admin' && adminKey !== ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key" });
    }

    const [existing] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (existing.length) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (name,email,password,role,ngo_type) VALUES (?,?,?,?,?)",
      [name, email, hashedPassword, role, role === 'ngo' ? ngo_type : null]
    );

    res.status(201).json({ message: "User registered successfully", userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.sqlMessage || err.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const [users] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (!users.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ').slice(1).join('') || '',
        email: user.email,
        role: user.role,
        ngo_type: user.ngo_type,
        mobile: user.phone || '',
        address: user.address || ''
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.sqlMessage || err.message });
  }
};

// Get current logged-in user
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await db.query("SELECT * FROM users WHERE id=?", [userId]);
    if (!users.length) return res.status(404).json({ message: "User not found" });

    const user = users[0];
    const nameParts = user.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join('') || '';

    res.json({
      user: {
        id: user.id,
        firstName,
        lastName,
        email: user.email,
        role: user.role,
        ngo_type: user.ngo_type || '',
        mobile: user.phone || '',
        address: user.address || ''
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.sqlMessage || err.message });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, mobile, address } = req.body;

    const fullName = `${firstName} ${lastName}`;

    const [result] = await db.query(
      "UPDATE users SET name=?, phone=?, address=? WHERE id=?",
      [fullName, mobile || null, address || null, userId]
    );

    if(result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: { firstName, lastName, mobile, address }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error", error: err.sqlMessage || err.message });
  }
};
