import { userCartItems, userOrders } from '@/database/schema'
import { db } from '@/database'
import { and, eq } from 'drizzle-orm'
import { CatalogItems, type CatalogItemId } from '@/data/catalog'

export async function getCartCountByItemId(userId: number, itemId: string) {
  const [item] = await db.select().from(userCartItems).where(eq(userCartItems.itemId, itemId))
  return item?.count ?? 0
}

export async function addToCart(userId: number, itemId: string) {
  const [existingItem] = await db.select().from(userCartItems).where(and(eq(userCartItems.tgId, userId), eq(userCartItems.itemId, itemId)))

  if (existingItem) {
    return await db.update(userCartItems).set({
      count: existingItem.count + 1,
    }).where(and(eq(userCartItems.tgId, userId), eq(userCartItems.itemId, itemId)))
  }

  await db.insert(userCartItems).values({
    tgId: userId,
    itemId,
    count: 1,
  })
}

export async function removeFromCart(userId: number, itemId: string) {
  const [existingItem] = await db.select().from(userCartItems).where(and(eq(userCartItems.tgId, userId), eq(userCartItems.itemId, itemId)))

  if (!existingItem) {
    return
  }

  const newCount = existingItem.count - 1
  if (newCount <= 0) {
    await db.delete(userCartItems).where(and(eq(userCartItems.tgId, userId), eq(userCartItems.itemId, itemId)))
    return
  }

  return await db.update(userCartItems).set({
    count: newCount,
  }).where(and(eq(userCartItems.tgId, userId), eq(userCartItems.itemId, itemId)))

}

export async function getCartItems(userId: number) {
  const items = await db.select().from(userCartItems).where(eq(userCartItems.tgId, userId))
  return items.filter((v) => v.count > 0)
}

export async function clearCartItems(userId: number) {
  await db.delete(userCartItems).where(eq(userCartItems.tgId, userId))
}

export async function createOrder(userId: number) {
  const userCart = await getCartItems(userId)

  const totalAmount = userCart.reduce((p, c) => {
    const itemData = CatalogItems.get(c.itemId as CatalogItemId)
    return p + (itemData!.price * c.count)
  }, 0)

  const [result] = await db.insert(userOrders).values({
    tgId: userId,
    cartItems: userCart.map((v) => ({
      item_id: v.itemId,
      count: v.count,
      price_per_one: CatalogItems.get(v.itemId as CatalogItemId)!.price,
    })),
    totalAmount,
  }).returning()

  return result.id
}

export async function getOrders(userId: number) {
  const orders = await db.select().from(userOrders).where(eq(userOrders.tgId, userId))
  return orders
}

export async function getOrder(userId: number, orderId: number) {
  const [order] = await db.select()
    .from(userOrders)
    .where(and(
      eq(userOrders.tgId, userId),
      eq(userOrders.id, orderId)
    ))

  return order
}
