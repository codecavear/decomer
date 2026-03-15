declare module '#auth-utils' {
  interface User {
    id: string
    googleId?: string | null
    email: string
    name?: string | null
    avatarUrl?: string | null
  }
}

export {}
