import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

export function createDatabase(connectionString: string) {
  const client = postgres(connectionString, { prepare: false, max: 10 })
  return drizzle(client, { schema })
}

export * from "./schema"
