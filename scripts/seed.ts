import path from "path"
import fs from "fs"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import Database from "better-sqlite3"

const dbPath = process.env.AUTH_DB_PATH
  ? path.isAbsolute(process.env.AUTH_DB_PATH)
    ? process.env.AUTH_DB_PATH
    : path.resolve(process.cwd(), process.env.AUTH_DB_PATH)
  : path.join(process.cwd(), "auth.db")

const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma("journal_mode = WAL")
db.exec(
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL
  )`
)

const { count } = db
  .prepare("SELECT COUNT(*) as count FROM users")
  .get() as { count: number }

if (count > 0) {
  console.log("Users already exist — skipping seed.")
  process.exit(0)
}

const DEFAULT_USERNAME = "admin"
const DEFAULT_PASSWORD = "admin123"

const hashed = bcrypt.hashSync(DEFAULT_PASSWORD, 10)
const id = randomUUID()

db.prepare(
  "INSERT INTO users (id, username, hashed_password) VALUES (?, ?, ?)"
).run(id, DEFAULT_USERNAME, hashed)

console.log("✅ Admin user created:")
console.log(`   Username: ${DEFAULT_USERNAME}`)
console.log(`   Password: ${DEFAULT_PASSWORD}`)
console.log("\nPlease change your password after first login.")
