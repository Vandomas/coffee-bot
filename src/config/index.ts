function env(key: string) {
    const keyData = process.env[key]
    if (!keyData) {
        throw new Error(`Environment variable ${key} is not set.`);
    }

    return keyData
}

export const CONFIG = {
    TELEGRAM_BOT_TOKEN: env('TELEGRAM_BOT_TOKEN'),
    POSTGRESQL_DATABASE_URL: env('POSTGRESQL_DATABASE_URL'),
}