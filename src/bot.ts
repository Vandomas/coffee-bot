import { Bot, GrammyError, HttpError, InlineKeyboard, InputFile, type Filter } from 'grammy'

import { CONFIG } from '@/config'
import type { BotApi, BotContext } from '@/types'
import { parseMode } from '@/lib/parseMode'
import { CATALOG_ITEMS, CatalogItems, type CatalogItemId } from '@/data/catalog'
import { addToCart, createOrder, getCartCountByItemId, getCartItems, getOrder, getOrders, removeFromCart } from '@/functions/db'
import { formatOrderDate } from '@/functions/utils'

const bot = new Bot<BotContext, BotApi>(CONFIG.TELEGRAM_BOT_TOKEN)

bot.catch((err) => {
  const ctx = err.ctx
  console.error(`Error while handling update ${ctx.update.update_id}:`)
  const e = err.error
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description)
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e)
  } else {
    console.error('Unknown error:', e)
  }
})

bot.api.config.use(parseMode('HTML'))

bot.callbackQuery('coffee:cart:order', async (ctx, next) => {
  const orderId = await createOrder(ctx.from.id)
  await ctx.answerCallbackQuery('Ваш заказ успешно оформлен!')
  ctx.callbackQuery.data = `coffee:order:${orderId}`
  return next()
})

bot.callbackQuery(/^coffee:cart:add:(.+):(cart|catalog)/, async (ctx, next) => {
  const itemId = ctx.match[1] as CatalogItemId
  const returnTo = ctx.match[2] as 'cart' | 'catalog'
  await addToCart(ctx.from.id, itemId)


  ctx.callbackQuery.data = returnTo === 'catalog' ? `coffee:catalog:${itemId}` : 'coffee:cart'
  return next()
})

bot.callbackQuery(/^coffee:cart:remove:(.+):(cart|catalog)/, async (ctx, next) => {
  const itemId = ctx.match[1] as CatalogItemId
  const returnTo = ctx.match[2] as 'cart' | 'catalog'
  await removeFromCart(ctx.from.id, itemId)

  ctx.callbackQuery.data = returnTo === 'catalog' ? `coffee:catalog:${itemId}` : 'coffee:cart'
  return next()
})

bot.callbackQuery('coffee:cart', async (ctx) => {
  const items = await getCartItems(ctx.from.id)

  const totalAmount = items.reduce((p, c) => {
    const itemData = CatalogItems.get(c.itemId as CatalogItemId)
    return p + (itemData!.price * c.count)
  }, 0)

  const text = `<b>🛒 Корзина</b>\n\n` + (items.length === 0 ? 'Для оформления заказа, пожалуйста добавьте что-то в корзину.' : `Проверка и оформление заказа.`)
  const inlineKeyboard = InlineKeyboard.from([
    ...items.map(item => {
      const itemData = CatalogItems.get(item.itemId as CatalogItemId)
      return [
        InlineKeyboard.text(
          `-`,
          `coffee:cart:remove:${item.itemId}:cart`,
        ),
        InlineKeyboard.text(
          `${itemData?.name} · ${item.count}`,
          `coffee:catalog:${item.itemId}`,
        ),
        InlineKeyboard.text(
          `+`,
          `coffee:cart:add:${item.itemId}:cart`,
        ),
      ]
    }),
    (items.length > 0 ? [InlineKeyboard.text(`Оформить заказ · ${totalAmount}₽`, 'coffee:cart:order')] : [InlineKeyboard.text('Перейти в каталог', 'coffee:catalog')]),
    [InlineKeyboard.text('« Назад', 'menu')],
  ])

  if (ctx.callbackQuery.message?.photo) {
    await ctx.deleteMessage()

    return ctx.reply(text, { reply_markup: inlineKeyboard })
  }

  return ctx.editMessageText(text, { reply_markup: inlineKeyboard })
})

bot.callbackQuery(/^coffee:catalog:(.+)/, async (ctx) => {
  const itemId = ctx.match[1] as CatalogItemId

  const item = CatalogItems.get(itemId)
  if (!item) {
    return ctx.answerCallbackQuery("Кофе не найден")
  }

  const cartCount = await getCartCountByItemId(ctx.from.id, itemId)

  const text = `☕️ <b>${item.name}</b>\n\n💬 ${item.description}\n\nЦена: ${item.price}₽`
  const inlineKeyboard = InlineKeyboard.from([
    [InlineKeyboard.text(
      `🛒 ${cartCount >= 1 ? `Корзина · ${cartCount}` : 'Добавить в корзину'}`,
      cartCount >= 1 ? 'coffee:cart' : `coffee:cart:add:${item.id}:catalog`,
    )],
    [InlineKeyboard.text('« Назад', 'coffee:catalog')],
  ])

  if (ctx.callbackQuery.message?.photo) {
    await ctx.editMessageCaption({
      caption: text,
      reply_markup: inlineKeyboard,
    })
    return
  }

  await ctx.deleteMessage()

  if (item.image_path) {
    const imageFile = new InputFile(item.image_path)
    await ctx.replyWithPhoto(imageFile, {
      caption: text,
      reply_markup: inlineKeyboard,
    })
    return
  }

  return ctx.editMessageText(text, { reply_markup: inlineKeyboard })
})

bot.callbackQuery('coffee:catalog', async (ctx) => {
  const inlineKeyboard = InlineKeyboard.from([
    ...CATALOG_ITEMS.map(item => [
      InlineKeyboard.text(
        `${item.name} · ${item.price}₽`,
        `coffee:catalog:${item.id}`,
      )
    ]),
    [InlineKeyboard.text('« Назад', 'menu')],
  ])

  const text = `<b>☕️ Каталог кофе</b>\n\n` + `Выберите кофе, который хотите заказать.`

  if (ctx.callbackQuery.message?.photo) {
    await ctx.deleteMessage()
    return ctx.reply(text, { reply_markup: inlineKeyboard, })
  }

  return ctx.editMessageText(text, { reply_markup: inlineKeyboard })
})


bot.callbackQuery(/coffee:order:(\d+)/, async (ctx) => {
  const orderId = Number(ctx.match[1])
  const order = await getOrder(ctx.from.id, orderId)

  const inlineKeyboard = InlineKeyboard.from([
    [InlineKeyboard.text('« Назад', 'coffee:orders')],
  ])

  return ctx.editMessageText(
    `<b>Заказ от ${formatOrderDate(order.createdAt)}</b>\n\n` +
    `` +
    `` +
    `${order.cartItems.map((c) => {
      const itemData = CatalogItems.get(c.item_id as CatalogItemId)!
      return `${itemData.name} · ${c.count} шт. · ${c.price_per_one}₽`
    }).join('\n')}\n\n` +
    `` +
    `` +
    `Общая сумма: <b>${order.totalAmount}₽</b>\n` +
    `` +
    ``,
    { reply_markup: inlineKeyboard },
  )
})

bot.callbackQuery('coffee:orders', async (ctx) => {
  const orders = await getOrders(ctx.from.id)
  const inlineKeyboard = InlineKeyboard.from([
    ...orders.map((o) => {
      return [InlineKeyboard.text(
        `Заказ от ${formatOrderDate(o.createdAt, false)}`,
        `coffee:order:${o.id}`,
      )]
    }),
    [InlineKeyboard.text('« Назад', 'menu')],
  ])

  return ctx.editMessageText(`<b>Ваши заказы</b>\n\n${orders.length === 0 ? 'На данный момент вы ничего не оформляли.' : ''}`, {
    reply_markup: inlineKeyboard,
  })
})

bot.callbackQuery('coffee:help', async (ctx) => {
  return ctx.editMessageText(
    `<b>ℹ️ Помощь</b>\n\n` + `Бот написан в рамках дипломной работы. Не является реальным ботом для заказа кофе.\nРассчитываю на хорошую оценку)\n\n`,
    {
      reply_markup: InlineKeyboard.from([
        [InlineKeyboard.text('« Назад', 'menu')],
      ]),
    },
  )
})

async function openMenu(
  ctx: Filter<BotContext, 'message'> | Filter<BotContext, 'callback_query'>,
) {
  const text = `<b>☕️ Coffee Bot</b> – Бот для удобного заказа кофе.\n\n`
    + `Закажите кофе в один клик, не выходя из Telegram! Заберите его в ближайшей кофейне.`

  const inlineKeyboard = InlineKeyboard.from([
    [InlineKeyboard.text('Каталог', 'coffee:catalog')],
    [InlineKeyboard.text('Корзина', 'coffee:cart')],
    [InlineKeyboard.text('Мои заказы', 'coffee:orders')],
    [InlineKeyboard.text('Помощь', 'coffee:help')],
  ])

  const method = ctx.callbackQuery ? 'editMessageText' : 'reply'
  return ctx[method](text, { reply_markup: inlineKeyboard })
}

bot.callbackQuery('menu', openMenu)
bot.on('message', openMenu)

export const TelegramBot = bot
