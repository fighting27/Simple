const db = require('../database/connection');

class User {
  static findById(id) {
    return db.prepare('SELECT id, username, nickname, avatar, created_at, updated_at FROM users WHERE id = ?').get(id);
  }

  static findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  static create({ username, password_hash, nickname = '' }) {
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, nickname) VALUES (?, ?, ?)'
    ).run(username, password_hash, nickname);
    return { id: result.lastInsertRowid, username, nickname };
  }

  static updateProfile(id, { nickname, avatar }) {
    const fields = [];
    const values = [];

    if (nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(avatar);
    }

    if (fields.length === 0) return null;

    fields.push("updated_at = datetime('now', 'localtime')");
    values.push(id);

    return db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  static updatePassword(id, password_hash) {
    return db.prepare(
      "UPDATE users SET password_hash = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
    ).run(password_hash, id);
  }
}

module.exports = User;
