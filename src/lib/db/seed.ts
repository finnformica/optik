import { hashPassword } from '@/lib/auth/session';
import { stripe } from '../payments/stripe';
import { db } from './config';
import { dimAccount, dimUser } from './schema';

async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const baseProduct = await stripe.products.create({
    name: 'Base',
    description: 'Base subscription plan',
  });

  await stripe.prices.create({
    product: baseProduct.id,
    unit_amount: 1000, // £10 in pence
    currency: 'gbp',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Plus subscription plan',
  });

  await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 2400, // £24 in pence
    currency: 'gbp',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
  });

  console.log('Stripe products and prices created successfully.');
}

async function seed() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  // Create a default user
  const [user] = await db
    .insert(dimUser)
    .values([
      {
        email: email,
        passwordHash: passwordHash,
        role: "owner",
      },
    ])
    .returning();

    // Create a default account for user
    await db
      .insert(dimAccount)
      .values({
        userId: user.id,
        accountName: 'Primary Account',
        accountType: 'INDIVIDUAL',
        currency: 'USD',
      });

  console.log('Initial user created.');

  // await createStripeProducts();
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
