/**
 * Notify Discord when a new user registers in DeComer.
 */
export async function notifyNewUser(user: {
  email: string
  name?: string | null
  provider: string
  plan?: string
  coupon?: string
}) {
  await Promise.allSettled([
    notifyDiscord(user)
  ])
}

async function notifyDiscord(user: {
  email: string
  name?: string | null
  provider: string
  plan?: string
  coupon?: string
}) {
  const botToken = process.env.DISCORD_BOT_TOKEN
  const channelId = process.env.DISCORD_NOTIFY_CHANNEL_ID
  if (!botToken || !channelId) return

  const plan = user.plan || 'free'
  const tierLine = user.coupon ? `${plan} (cupón: ${user.coupon})` : plan
  const name = user.name || 'Sin nombre'

  const content = `🆕 **DeComer** — ${name} (${user.email})\n🔑 ${user.provider} · **${tierLine}**`

  try {
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    })
  } catch {
    console.error('[Notify] Discord send failed:', _e)
  }
}
