const db = require('../config/db');

class FoodPost {
    // Create new food post (Donor)
    static async create(donorId, foodName, quantity, expiryTime, location) {
        return db.execute(
            `INSERT INTO food_posts (donor_id, food_name, quantity, expiry_time, location) VALUES (?, ?, ?, ?, ?)`,
            [donorId, foodName, quantity, expiryTime, location]
        );
    }

    // Get all available food posts for receivers/volunteers
    static async getAvailable() {
        return db.execute(
            `SELECT fp.id, fp.food_name, fp.quantity, fp.expiry_time, fp.status, fp.location, 
                    u.name AS donor_name, u.email AS donor_email
             FROM food_posts fp
             JOIN users u ON fp.donor_id = u.id
             WHERE fp.status IN ('Pending', 'Accepted')
             ORDER BY fp.created_at DESC`
        );
    }

    // Get single food post
    static async getById(id) {
        return db.execute(
            `SELECT fp.id, fp.food_name, fp.quantity, fp.expiry_time, fp.status, fp.location,
                    u.name AS donor_name, u.email AS donor_email
             FROM food_posts fp
             JOIN users u ON fp.donor_id = u.id
             WHERE fp.id = ?`,
            [id]
        );
    }

    // Update status (Pending → Accepted → Picked → Verified)
    static async updateStatus(id, status) {
        return db.execute(
            `UPDATE food_posts SET status = ? WHERE id = ?`,
            [status, id]
        );
    }
}

module.exports = FoodPost;
