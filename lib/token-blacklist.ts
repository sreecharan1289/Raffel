// Simple in-memory token blacklist (for production, use Redis)
const blacklistedTokens = new Set<string>()

export function blacklistToken(token: string): void {
  blacklistedTokens.add(token)
  
  // Clean up expired tokens periodically (optional optimization)
  if (blacklistedTokens.size > 1000) {
    // In production, you'd want a more sophisticated cleanup
    console.log('Token blacklist cleanup needed - consider using Redis')
  }
}

export function isTokenBlacklisted(token: string): boolean {
  return blacklistedTokens.has(token)
}

export function clearBlacklist(): void {
  blacklistedTokens.clear()
}