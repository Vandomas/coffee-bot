export function chunk<T>(array: T[], size: number): T[][] {
  if (!Array.isArray(array) || size < 1) {
    return []
  }

  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }

  return result
}

export function formatOrderDate(date: Date, years: boolean = true): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()

  return `${hours}:${minutes} ${day}.${month}${years ? `.${year}` : ''}`
}
