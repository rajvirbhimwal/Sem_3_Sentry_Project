// Temporary in-memory OTP storage for local development only.
const records = new Map();
function save(key, value) { records.set(key, value); }
function get(key) { return records.get(key); }
function remove(key) { records.delete(key); }
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of records.entries()) {
    if (!value || value.expiresAt <= now) records.delete(key);
  }
}, 60000).unref();
module.exports = { save, get, delete: remove };
