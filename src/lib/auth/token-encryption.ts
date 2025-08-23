import crypto from 'crypto'

export class TokenEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16

  private static getEncryptionKey(): Buffer {
    // Use environment variable or derive from user-specific data
    const key = process.env.TOKEN_ENCRYPTION_KEY
    if (!key) {
      throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required')
    }
    return crypto.scryptSync(key, 'salt', TokenEncryption.KEY_LENGTH)
  }

  static encrypt(plaintext: string): string {
    const key = TokenEncryption.getEncryptionKey()
    const iv = crypto.randomBytes(TokenEncryption.IV_LENGTH)
    
    const cipher = crypto.createCipheriv(TokenEncryption.ALGORITHM, key, iv)
    cipher.setAutoPadding(true)
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Combine iv + authTag + encrypted data
    return iv.toString('hex') + authTag.toString('hex') + encrypted
  }

  static decrypt(encryptedData: string): string {
    const key = TokenEncryption.getEncryptionKey()
    
    // Extract components
    const iv = Buffer.from(encryptedData.slice(0, TokenEncryption.IV_LENGTH * 2), 'hex')
    const authTag = Buffer.from(
      encryptedData.slice(TokenEncryption.IV_LENGTH * 2, (TokenEncryption.IV_LENGTH + TokenEncryption.TAG_LENGTH) * 2), 
      'hex'
    )
    const encrypted = encryptedData.slice((TokenEncryption.IV_LENGTH + TokenEncryption.TAG_LENGTH) * 2)
    
    const decipher = crypto.createDecipheriv(TokenEncryption.ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}