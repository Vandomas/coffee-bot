import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { CONFIG } from '@/config'

const client = postgres(CONFIG.POSTGRESQL_DATABASE_URL)

export const db = drizzle(client)

