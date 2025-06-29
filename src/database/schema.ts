import { sql } from 'drizzle-orm'
import { bigint, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const userCartItems = pgTable('user_cart_items', {
  tgId: bigint('tg_id', { mode: 'number' }).notNull(),
  itemId: text('item_id').notNull(),
  count: integer('count').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const userOrders = pgTable('user_orders', {
  id: serial('id'),
  tgId: bigint('tg_id', { mode: 'number' }).notNull(),
  cartItems: jsonb('cart_items').$type<{
    item_id: string,
    count: number,
    price_per_one: number
  }[]>().notNull(),
  totalAmount: integer('total_amount').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
