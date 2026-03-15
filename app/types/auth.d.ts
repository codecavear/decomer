// Extend nuxt-auth-utils User type
declare module '#auth-utils' {
  interface User {
    id: string
    googleId: string
    email: string
    name: string
    avatarUrl: string | null
    role: 'user' | 'store_owner' | 'admin'
  }
}

export {}
