import { app, safeStorage, shell } from 'electron'
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import log from 'electron-log/main'

// OAuth Configuration
const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e'
const AUTH_URL = 'https://claude.ai/oauth/authorize'
const TOKEN_URL = 'https://console.anthropic.com/v1/oauth/token'
const REDIRECT_URI = 'https://console.anthropic.com/oauth/code/callback'
const SCOPE = 'org:create_api_key user:profile user:inference'

// Token refresh buffer (5 minutes in milliseconds)
const REFRESH_BUFFER_MS = 5 * 60 * 1000

interface TokenData {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: string
  scope: string
}

class ClaudeSubscriptionError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'ClaudeSubscriptionError'
  }
}

export class ClaudeSubscriptionService {
  private tokenFilePath: string
  private cachedTokens: TokenData | null = null
  private pendingCodeVerifier: string | null = null

  constructor() {
    this.tokenFilePath = join(app.getPath('userData'), '.claude_subscription_token')
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    // Generate random code verifier (32 bytes, base64url encoded)
    const codeVerifier = randomBytes(32).toString('base64url')

    // Create code challenge (SHA-256 hash of verifier, base64url encoded)
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')

    return { codeVerifier, codeChallenge }
  }

  /**
   * Build the authorization URL with PKCE parameters
   */
  async getAuthorizationUrl(): Promise<{ authUrl: string; codeVerifier: string }> {
    const { codeVerifier, codeChallenge } = this.generatePKCE()

    const url = new URL(AUTH_URL)
    url.searchParams.set('code', 'true')
    url.searchParams.set('client_id', CLIENT_ID)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', REDIRECT_URI)
    url.searchParams.set('scope', SCOPE)
    url.searchParams.set('code_challenge', codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')
    url.searchParams.set('state', codeVerifier) // Use verifier as state for simplicity

    return {
      authUrl: url.toString(),
      codeVerifier,
    }
  }

  /**
   * Start the OAuth authorization flow by opening browser
   */
  async startAuthorization(): Promise<{ codeVerifier: string }> {
    const { authUrl, codeVerifier } = await this.getAuthorizationUrl()

    // Store code verifier for later use
    this.pendingCodeVerifier = codeVerifier

    log.info('[ClaudeSubscription] Opening browser for authorization')
    await shell.openExternal(authUrl)

    return { codeVerifier }
  }

  /**
   * Complete authorization by exchanging code for tokens
   */
  async completeAuthorization(code: string, codeVerifier?: string): Promise<TokenData> {
    const verifier = codeVerifier || this.pendingCodeVerifier
    if (!verifier) {
      throw new ClaudeSubscriptionError('No code verifier available. Please start authorization first.')
    }

    const tokens = await this.exchangeCodeForTokens(code, verifier)
    await this.saveTokens(tokens)
    this.pendingCodeVerifier = null

    log.info('[ClaudeSubscription] Authorization completed successfully')
    return tokens
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenData> {
    // Code may contain hash with state, extract just the code part
    const [authCode, state] = code.split('#')
    const verifier = state || codeVerifier

    log.info('[ClaudeSubscription] Exchanging code for tokens...')

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: authCode,
        state: verifier,
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error('[ClaudeSubscription] Token exchange failed:', errorText)
      throw new ClaudeSubscriptionError(`Failed to exchange code for tokens: ${response.status}`)
    }

    const data = await response.json()

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + data.expires_in * 1000,
      token_type: data.token_type,
      scope: data.scope,
    }
  }

  /**
   * Refresh expired tokens
   */
  async refreshTokens(): Promise<TokenData> {
    const tokens = await this.getStoredTokens()
    if (!tokens?.refresh_token) {
      throw new ClaudeSubscriptionError('No refresh token available. Please re-authenticate.')
    }

    log.info('[ClaudeSubscription] Refreshing tokens...')

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: CLIENT_ID,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error('[ClaudeSubscription] Token refresh failed:', errorText)
      // Clear invalid tokens
      await this.logout()
      throw new ClaudeSubscriptionError(`Failed to refresh tokens: ${response.status}`)
    }

    const data = await response.json()

    const newTokens: TokenData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + data.expires_in * 1000,
      token_type: data.token_type,
      scope: data.scope,
    }

    await this.saveTokens(newTokens)
    return newTokens
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    // Check cached token first
    if (this.cachedTokens) {
      const now = Date.now()
      // Return cached if more than 5 minutes until expiry
      if (this.cachedTokens.expires_at - now > REFRESH_BUFFER_MS) {
        return this.cachedTokens.access_token
      }
    }

    const tokens = await this.getStoredTokens()
    if (!tokens) {
      throw new ClaudeSubscriptionError('Not authenticated. Please login first.')
    }

    const now = Date.now()
    // Refresh if less than 5 minutes until expiry
    if (tokens.expires_at - now <= REFRESH_BUFFER_MS) {
      log.info('[ClaudeSubscription] Token expiring soon, refreshing...')
      const newTokens = await this.refreshTokens()
      this.cachedTokens = newTokens
      return newTokens.access_token
    }

    this.cachedTokens = tokens
    return tokens.access_token
  }

  /**
   * Save tokens with encryption via safeStorage
   */
  async saveTokens(tokens: TokenData): Promise<void> {
    try {
      const tokenJson = JSON.stringify(tokens)

      // Fallback to plaintext if encryption unavailable
      if (!safeStorage.isEncryptionAvailable()) {
        log.warn('[ClaudeSubscription] Encryption unavailable, storing tokens in plaintext')
        await fs.writeFile(this.tokenFilePath, tokenJson, 'utf8')
        this.cachedTokens = tokens
        return
      }

      // Encrypt using OS keychain (safeStorage)
      const encrypted = safeStorage.encryptString(tokenJson)
      const dir = dirname(this.tokenFilePath)

      // Ensure directory exists
      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true })
      }

      // Write encrypted buffer
      await fs.writeFile(this.tokenFilePath, encrypted)
      this.cachedTokens = tokens

      log.info('[ClaudeSubscription] Tokens saved securely')
    } catch (error) {
      log.error('[ClaudeSubscription] Failed to save tokens:', error)
      throw new ClaudeSubscriptionError('Failed to save tokens', error)
    }
  }

  /**
   * Get stored tokens, decrypting if necessary
   */
  async getStoredTokens(): Promise<TokenData | null> {
    try {
      if (!existsSync(this.tokenFilePath)) {
        return null
      }

      const data = await fs.readFile(this.tokenFilePath)

      // Try to decrypt if encryption is available
      if (safeStorage.isEncryptionAvailable()) {
        try {
          const decrypted = safeStorage.decryptString(data)
          return JSON.parse(decrypted)
        } catch {
          // Fallback: might be plaintext from before encryption was available
          const text = data.toString('utf8')
          return JSON.parse(text)
        }
      }

      // Plaintext fallback
      const text = data.toString('utf8')
      return JSON.parse(text)
    } catch (error) {
      log.error('[ClaudeSubscription] Failed to read tokens:', error)
      return null
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens()
    return tokens !== null
  }

  /**
   * Check if stored token is still valid (not expired)
   */
  async isTokenValid(): Promise<boolean> {
    const tokens = await this.getStoredTokens()
    if (!tokens) return false

    // Check if token is expired (with buffer)
    const now = Date.now()
    return tokens.expires_at - now > REFRESH_BUFFER_MS
  }

  /**
   * Clear stored tokens and cache
   */
  async logout(): Promise<void> {
    try {
      if (existsSync(this.tokenFilePath)) {
        await fs.unlink(this.tokenFilePath)
      }
      this.cachedTokens = null
      this.pendingCodeVerifier = null
      log.info('[ClaudeSubscription] Logged out successfully')
    } catch (error) {
      log.error('[ClaudeSubscription] Failed to logout:', error)
      throw new ClaudeSubscriptionError('Failed to logout', error)
    }
  }

  /**
   * Cancel pending authorization
   */
  cancelAuthorization(): void {
    this.pendingCodeVerifier = null
    log.info('[ClaudeSubscription] Authorization cancelled')
  }
}

// Export singleton instance
export const claudeSubscriptionService = new ClaudeSubscriptionService()
