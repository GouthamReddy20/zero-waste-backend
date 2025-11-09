import db from "../config/db.js";

export const createContact = (name, email, message, callback) => {
  const sql = "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)";
  db.query(sql, [name, email, message], callback);
};

export const getAllContacts = (callback) => {
  const sql = "SELECT * FROM contacts";
  db.query(sql, callback);
};
