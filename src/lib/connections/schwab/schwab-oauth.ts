import { TokenEncryption } from '@/lib/auth/token-encryption'
import { db } from '@/lib/db/config'
import { userAccessTokens } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export interface SchwabTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export class SchwabAuth {
  private appKey: string
  private appSecret: string
  private baseUrl: string = 'https://api.schwabapi.com'

  constructor() {
    if (!process.env.SCHWAB_APP_KEY) {
      throw new Error('SCHWAB_APP_KEY environment variable is required')
    }
    if (!process.env.SCHWAB_APP_SECRET) {
      throw new Error('SCHWAB_APP_SECRET environment variable is required')
    }

    this.appKey = process.env.SCHWAB_APP_KEY
    this.appSecret = process.env.SCHWAB_APP_SECRET
  }

  // Store tokens
  async storeTokens(userId: string, tokens: SchwabTokens): Promise<void> {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
    
    // Encrypt token data
    const sensitiveData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    }
    
    const encryptedTokens = TokenEncryption.encrypt(JSON.stringify(sensitiveData))

    try {
      await db
        .insert(userAccessTokens)
        .values({
          userId: parseInt(userId),
          encryptedTokens,
          expiresAt,
          tokenType: tokens.token_type,
          scope: tokens.scope,
          broker: 'schwab',
        })
        .onConflictDoUpdate({
          target: [userAccessTokens.userId, userAccessTokens.broker],
          set: {
            encryptedTokens,
            expiresAt,
            tokenType: tokens.token_type,
            scope: tokens.scope,
            updatedAt: new Date(),
          },
        })
    } catch (error) {
      throw new Error(`Failed to store tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Retrieve and decrypt tokens
  async getStoredTokens(userId: string): Promise<SchwabTokens | null> {
    try {
      const data = await db
        .select()
        .from(userAccessTokens)
        .where(and(
          eq(userAccessTokens.userId, parseInt(userId)),
          eq(userAccessTokens.broker, 'schwab')
        ))

      if (!data || data.length === 0) {
        return null
      }

      const tokenRecord = data[0]

      try {
        // Decrypt token data
        const decryptedData = TokenEncryption.decrypt(tokenRecord.encryptedTokens)
        const sensitiveTokens = JSON.parse(decryptedData)

        return {
          access_token: sensitiveTokens.access_token,
          refresh_token: sensitiveTokens.refresh_token,
          expires_in: Math.floor((tokenRecord.expiresAt.getTime() - Date.now()) / 1000),
          token_type: tokenRecord.tokenType,
          scope: tokenRecord.scope,
        }
      } catch (decryptionError) {
        console.error('Failed to decrypt tokens:', decryptionError)
        return null
      }
    } catch (error) {
      console.error('Failed to retrieve tokens:', error)
      return null
    }
  }

  // Enhanced token refresh with retry logic
  async refreshAccessTokenSecurely(userId: string): Promise<string> {
    const tokens = await this.getStoredTokens(userId)
    
    if (!tokens) {
      throw new Error('No stored tokens found. User needs to re-authenticate.')
    }

    // Check if token expires within next 5 minutes
    if (tokens.expires_in > 300) {
      return tokens.access_token
    }

    try {
      const newTokens = await this.refreshAccessToken(tokens.refresh_token)
      await this.storeTokens(userId, newTokens)
      return newTokens.access_token
    } catch (error) {
      // If refresh fails, user needs to re-authenticate
      await this.clearStoredTokens(userId)
      throw new Error('Token refresh failed. User needs to re-authenticate.')
    }
  }

  // Clear tokens (for logout or failed refresh)
  async clearStoredTokens(userId: string): Promise<void> {
    try {
      await db
        .delete(userAccessTokens)
        .where(and(
          eq(userAccessTokens.userId, parseInt(userId)),
          eq(userAccessTokens.broker, 'schwab')
        ))
    } catch (error) {
      console.error('Failed to clear tokens:', error)
      throw new Error(`Failed to clear tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.appKey,
      redirect_uri: redirectUri,
    })

    const authUrl = `${this.baseUrl}/v1/oauth/authorize?${params.toString()}`
    return authUrl
  }

  // Exchange authorization code for access tokens
  async exchangeCodeForTokens(authorizationCode: string, redirectUri: string): Promise<SchwabTokens> {
    const credentials = btoa(`${this.appKey}:${this.appSecret}`)

    const response = await fetch(`${this.baseUrl}/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token exchange error details:', errorText)
      throw new Error(`Token exchange failed: ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<SchwabTokens> {
    const credentials = btoa(`${this.appKey}:${this.appSecret}`)
    
    const response = await fetch(`${this.baseUrl}/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token refresh failed: ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(userId: string, endpoint: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.refreshAccessTokenSecurely(userId)
    
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }
}