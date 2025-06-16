import { TelegramBot } from '@/bot'

async function main() {
  TelegramBot.start({
    onStart(botInfo) {
      console.log(`Bot started at @${botInfo.username}`)
    },
  })
}

main()
