import { createDatabase } from "@clearhead/database"

// postgres.js connects lazily. The unreachable fallback allows static pages to
// compile; every deployed/authenticated request still requires DATABASE_URL.
export const db = createDatabase(process.env.DATABASE_URL ?? "postgres://build:build@127.0.0.1:1/clearhead")
