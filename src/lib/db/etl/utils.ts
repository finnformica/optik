import { dimAccount, dimBroker, dimDate, dimSecurity } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getAccountKey(userId: number, database: any) {
    const accountResult = await database.select({ accountKey: dimAccount.accountKey })
      .from(dimAccount)
      .where(eq(dimAccount.userId, userId))
      .limit(1);
    
    if (accountResult.length === 0) {
      throw new Error(`Account not found for user ${userId}`);
    }
    
    return accountResult[0].accountKey;
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
    
    // First try to find existing security
    const existingSecurity = await database.select({ securityKey: dimSecurity.securityKey })
      .from(dimSecurity)
      .where(eq(dimSecurity.symbol, symbol))
      .limit(1);
    
    if (existingSecurity.length > 0) {
      return existingSecurity[0].securityKey;
    }
    
    // If not found, create new security
    const result = await database.insert(dimSecurity).values({
      symbol,
      securityType,
      optionType,
      strikePrice,
      expiryDate,
      securityName,
      underlyingSymbol
    }).returning({ securityKey: dimSecurity.securityKey });
    
    return result[0].securityKey;
  }

  export async function getBrokerKey(brokerCode: string, database: any) {
    const brokerResult = await database.select({ brokerKey: dimBroker.brokerKey })
      .from(dimBroker)
      .where(eq(dimBroker.brokerCode, brokerCode))
      .limit(1);
    
    if (brokerResult.length === 0) {
      throw new Error(`Broker ${brokerCode} not found`);
    }
    
    return brokerResult[0].brokerKey;
  }