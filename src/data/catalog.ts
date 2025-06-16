const CATALOG_PHOTOS_PATH = './src/data/catalog-photos'

export const CATALOG_ITEMS = [
  {
    id: 'espresso',
    name: 'Эспрессо',
    description: 'Классический итальянский кофе, крепкий и насыщенный.',
    price: 150,
    image_path: `${CATALOG_PHOTOS_PATH}/espresso.png`,
  },
  {
    id: 'americano',
    name: 'Американо c молоком',
    description: 'Крепкий черный кофе, с молоком.',
    price: 180,
    image_path: `${CATALOG_PHOTOS_PATH}/americano.png`,
  },
  {
    id: 'cappuccino',
    name: 'Капучино',
    description: 'Кофе с молочной пенкой, классика жанра.',
    price: 220,
    image_path: `${CATALOG_PHOTOS_PATH}/cappuccino.png`,
  },
  {
    id: 'latte',
    name: 'Латте',
    description: 'Мягкий кофе с молоком, идеально подходит для утреннего пробуждения.',
    price: 200,
    image_path: `${CATALOG_PHOTOS_PATH}/latte.png`,
  },
  {
    id: 'raf',
    name: 'Раф',
    description: 'Секрет Рафа кроется в однородности и бархатистости напитка.',
    price: 350,
    image_path: `${CATALOG_PHOTOS_PATH}/raf.png`,
  },
] as const

export type CatalogItemId = (typeof CATALOG_ITEMS)[number]['id']

export const CatalogItems = new Map(
  CATALOG_ITEMS.map(item => [item.id, item])
)
