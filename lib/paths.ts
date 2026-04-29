import path from "path"

/**
 * Resolves a path-type environment variable.
 *
 * In production (NODE_ENV=production): the env var is REQUIRED.
 * Missing it prints a clear error and crashes the process so the
 * container/deployment fails loudly on startup rather than serving
 * broken requests silently.
 *
 * In development: falls back to devDefault resolved from CWD.
 */
function resolvePath(envVar: string, devDefault: string): string {
  const value = process.env[envVar]

  if (!value) {
    if (process.env.NODE_ENV === "production") {
      console.error(`\n❌  Missing required environment variable: ${envVar}`)
      console.error(
        `    Set ${envVar} to the absolute path of the target file/directory.\n`
      )
      process.exit(1)
    }
    return path.resolve(process.cwd(), /* turbopackIgnore: true */ devDefault)
  }

  // turbopackIgnore: dynamic paths are resolved at runtime from env vars, not traced at build time
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), /* turbopackIgnore: true */ value)
}

/** Absolute path to the expense SQLite database. */
export function getExpenseDbPath(): string {
  return resolvePath("EXPENSE_DB_PATH", "expenses.db")
}

/** Absolute path to the auth SQLite database. */
export function getAuthDbPath(): string {
  return resolvePath("AUTH_DB_PATH", "auth.db")
}

/** Absolute path to the directory that holds uploaded attachments. */
export function getAttachmentsDirPath(): string {
  return resolvePath("ATTACHMENTS_DIR_PATH", "../data/mcp/expense_db/attachments")
}
