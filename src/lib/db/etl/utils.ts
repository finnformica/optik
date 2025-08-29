import { dimAccount, dimBroker, dimDate, dimSecurity } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getAccountKey(userId: number, database: any) {
    const accountKey = await database.select(dimAccount.accountKey)
      .from(dimAccount)
      .where(eq(dimAccount.userId, userId))
      .limit(1);
    
    if (accountKey.length === 0) {
      throw new Error(`Account not found for user ${userId}`);
    }
    
    return accountKey[0];
  }
  
  export async function getDate(date: string, database: any) {
    const isoDate = new Date(date).toISOString().split('T')[0]
    const dimDateRecord = await database.select()
      .from(dimDate)
      .where(eq(dimDate.fullDate, isoDate))
      .limit(1);
    
    if (dimDateRecord.length === 0) {
      throw new Error(`Date not found for ${date}`);
    }
    
    return dimDateRecord[0];
  }
  
  export async function getOrCreateSecurity(instrument: any, database: any) {
    // Parse Schwab instrument data
    const symbol = instrument.symbol;
    const securityType = instrument.assetType === 'OPTION' ? 'OPTION' : 'STOCK';
    const optionType = instrument.putCall || null;
    const strikePrice = instrument.strikePrice?.toString() || null;
    const expiryDate = instrument.expirationDate ? 
      new Date(instrument.expirationDate).toISOString().slice(0, 10) : null;
    const underlyingSymbol = instrument.underlyingSymbol || symbol;
    const securityName = instrument.description;
    
    // Insert with onConflictDoNothing for simplicity - only creates if doesn't exist
    const securityKey = await database.insert(dimSecurity).values({
      symbol,
      securityType,
      optionType,
      strikePrice,
      expiryDate,
      securityName,
      underlyingSymbol
    }).onConflictDoNothing().returning({ securityKey: dimSecurity.securityKey });
    
    return securityKey[0];
  }

  export async function getBrokerKey(brokerCode: string, database: any) {
    const brokerKey = await database.select(dimBroker.brokerKey)
      .from(dimBroker)
      .where(eq(dimBroker.brokerCode, brokerCode))
      .limit(1);
    
    if (brokerKey.length === 0) {
      throw new Error(`Broker ${brokerCode} not found`);
    }
    
    return brokerKey[0];
  }