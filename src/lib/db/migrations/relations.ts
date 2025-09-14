import { relations } from "drizzle-orm/relations";
import {
  users,
  dimAccount,
  rawTransactions,
  dimDate,
  factTransactions,
  dimSecurity,
  dimTransactionType,
  dimBroker,
  dimBrokerAccounts,
  userAccessTokens,
} from "./schema";

export const dimAccountRelations = relations(dimAccount, ({ one, many }) => ({
  user: one(users, {
    fields: [dimAccount.userId],
    references: [users.id],
  }),
  factTransactions: many(factTransactions),
  dimBrokerAccounts: many(dimBrokerAccounts),
}));

export const usersRelations = relations(users, ({ many }) => ({
  dimAccounts: many(dimAccount),
  rawTransactions: many(rawTransactions),
  userAccessTokens: many(userAccessTokens),
}));

export const rawTransactionsRelations = relations(
  rawTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [rawTransactions.userId],
      references: [users.id],
    }),
  }),
);

export const factTransactionsRelations = relations(
  factTransactions,
  ({ one }) => ({
    dimDate: one(dimDate, {
      fields: [factTransactions.dateKey],
      references: [dimDate.dateKey],
    }),
    dimAccount: one(dimAccount, {
      fields: [factTransactions.accountKey],
      references: [dimAccount.accountKey],
    }),
    dimSecurity_securityKey: one(dimSecurity, {
      fields: [factTransactions.securityKey],
      references: [dimSecurity.securityKey],
      relationName: "factTransactions_securityKey_dimSecurity_securityKey",
    }),
    dimTransactionType: one(dimTransactionType, {
      fields: [factTransactions.transactionTypeKey],
      references: [dimTransactionType.transactionTypeKey],
    }),
    dimBroker: one(dimBroker, {
      fields: [factTransactions.brokerKey],
      references: [dimBroker.brokerKey],
    }),
    dimSecurity_securityKey: one(dimSecurity, {
      fields: [factTransactions.securityKey],
      references: [dimSecurity.securityKey],
      relationName: "factTransactions_securityKey_dimSecurity_securityKey",
    }),
  }),
);

export const dimDateRelations = relations(dimDate, ({ many }) => ({
  factTransactions: many(factTransactions),
}));

export const dimSecurityRelations = relations(dimSecurity, ({ many }) => ({
  factTransactions_securityKey: many(factTransactions, {
    relationName: "factTransactions_securityKey_dimSecurity_securityKey",
  }),
  factTransactions_securityKey: many(factTransactions, {
    relationName: "factTransactions_securityKey_dimSecurity_securityKey",
  }),
}));

export const dimTransactionTypeRelations = relations(
  dimTransactionType,
  ({ many }) => ({
    factTransactions: many(factTransactions),
  }),
);

export const dimBrokerRelations = relations(dimBroker, ({ many }) => ({
  factTransactions: many(factTransactions),
  dimBrokerAccounts: many(dimBrokerAccounts),
  userAccessTokens: many(userAccessTokens),
}));

export const dimBrokerAccountsRelations = relations(
  dimBrokerAccounts,
  ({ one }) => ({
    dimAccount: one(dimAccount, {
      fields: [dimBrokerAccounts.accountKey],
      references: [dimAccount.accountKey],
    }),
    dimBroker: one(dimBroker, {
      fields: [dimBrokerAccounts.brokerKey],
      references: [dimBroker.brokerKey],
    }),
  }),
);

export const userAccessTokensRelations = relations(
  userAccessTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [userAccessTokens.userId],
      references: [users.id],
    }),
    dimBroker: one(dimBroker, {
      fields: [userAccessTokens.brokerCode],
      references: [dimBroker.brokerCode],
    }),
  }),
);
