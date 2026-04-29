import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import { getAuthDbPath } from "@/lib/paths"

export interface User {
  id: string
  username: string
  hashed_password: string
}

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    const dbPath = getAuthDbPath()
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    _db = new Database(dbPath)
    _db.pragma("journal_mode = WAL")
    _db.exec(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL
      )`
    )
  }
  return _db
}

export function findUserByUsername(username: string): User | null {
  return (
    (getDb()
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as User) ?? null
  )
}

export function updateUserPassword(id: string, hashedPassword: string): void {
  getDb()
    .prepare("UPDATE users SET hashed_password = ? WHERE id = ?")
    .run(hashedPassword, id)
}

export function countUsers(): number {
  const { count } = getDb()
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number }
  return count
}

export function insertUser(id: string, username: string, hashedPassword: string): void {
  getDb()
    .prepare("INSERT INTO users (id, username, hashed_password) VALUES (?, ?, ?)")
    .run(id, username, hashedPassword)
}
