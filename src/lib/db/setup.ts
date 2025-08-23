import { exec } from 'node:child_process';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function checkSupabaseCLI() {
  console.log(
    'Step 1: Checking if Supabase CLI is installed...'
  );
  try {
    await execAsync('npx supabase --version');
    console.log('Supabase CLI is installed.');
  } catch (error) {
    console.error(
      'Supabase CLI is not installed. Please install it and try again.'
    );
    console.log('To install Supabase CLI, follow these steps:');
    console.log('1. Visit: https://supabase.com/docs/guides/cli/getting-started');
    console.log('2. Install using: brew install supabase/tap/supabase');
    console.log('3. After installation, run: supabase init');
    console.log(
      'After installation, please run this setup script again.'
    );
    process.exit(1);
  }
}

async function checkStripeCLI() {
  console.log(
    'Step 2: Checking if Stripe CLI is installed and authenticated...'
  );
  try {
    await execAsync('stripe --version');
    console.log('Stripe CLI is installed.');

    // Check if Stripe CLI is authenticated
    try {
      await execAsync('stripe config --list');
      console.log('Stripe CLI is authenticated.');
    } catch (error) {
      console.log(
        'Stripe CLI is not authenticated or the authentication has expired.'
      );
      console.log('Please run: stripe login');
      const answer = await question(
        'Have you completed the authentication? (y/n): '
      );
      if (answer.toLowerCase() !== 'y') {
        console.log(
          'Please authenticate with Stripe CLI and run this script again.'
        );
        process.exit(1);
      }

      // Verify authentication after user confirms login
      try {
        await execAsync('stripe config --list');
        console.log('Stripe CLI authentication confirmed.');
      } catch (error) {
        console.error(
          'Failed to verify Stripe CLI authentication. Please try again.'
        );
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(
      'Stripe CLI is not installed. Please install it and try again.'
    );
    console.log('To install Stripe CLI, follow these steps:');
    console.log('1. Visit: https://docs.stripe.com/stripe-cli');
    console.log(
      '2. Download and install the Stripe CLI for your operating system'
    );
    console.log('3. After installation, run: stripe login');
    console.log(
      'After installation and authentication, please run this setup script again.'
    );
    process.exit(1);
  }
}

async function setupSupabase() {
  console.log('Step 3: Setting up Supabase locally...');
  
  // Check if supabase directory exists
  const supabaseDir = path.join(process.cwd(), 'supabase');
  try {
    await fs.access(supabaseDir);
    console.log('Supabase directory already exists.');
  } catch (error) {
    console.log('Initializing Supabase...');
    try {
      await execAsync('npx supabase init');
      console.log('Supabase initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize Supabase. Please try again.');
      process.exit(1);
    }
  }

  // Start Supabase
  console.log('Starting Supabase locally...');
  try {
    await execAsync('npx supabase start');
    console.log('Supabase started successfully.');
  } catch (error) {
    console.error('Failed to start Supabase. Please try again.');
    process.exit(1);
  }
}

async function getStripeSecretKey(): Promise<string> {
  console.log('Step 4: Getting Stripe Secret Key');
  console.log(
    'You can find your Stripe Secret Key at: https://dashboard.stripe.com/test/apikeys'
  );
  return await question('Enter your Stripe Secret Key: ');
}

async function createStripeWebhook(): Promise<string> {
  console.log('Step 5: Creating Stripe webhook...');
  try {
    const { stdout } = await execAsync('stripe listen --print-secret');
    const match = stdout.match(/whsec_[a-zA-Z0-9]+/);
    if (!match) {
      throw new Error('Failed to extract Stripe webhook secret');
    }
    console.log('Stripe webhook created.');
    return match[0];
  } catch (error) {
    console.error(
      'Failed to create Stripe webhook. Check your Stripe CLI installation and permissions.'
    );
    if (os.platform() === 'win32') {
      console.log(
        'Note: On Windows, you may need to run this script as an administrator.'
      );
    }
    throw error;
  }
}

function generateAuthSecret(): string {
  console.log('Step 6: Generating AUTH_SECRET...');
  return crypto.randomBytes(32).toString('hex');
}

async function writeEnvFile(envVars: Record<string, string>) {
  console.log('Step 7: Writing environment variables to .env');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  console.log('.env file created with the necessary variables.');
}

async function main() {
  await checkSupabaseCLI();
  await checkStripeCLI();
  await setupSupabase();

  const STRIPE_SECRET_KEY = await getStripeSecretKey();
  const STRIPE_WEBHOOK_SECRET = await createStripeWebhook();
  const AUTH_SECRET = generateAuthSecret();

  await writeEnvFile({
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    AUTH_SECRET,
    SUPABASE_DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    BASE_URL: 'http://localhost:3000',
  });

  console.log('\n🎉 Setup completed successfully!\n');
  console.log('Your Supabase instance is running at: http://127.0.0.1:54321');
  console.log('Supabase Studio is available at: http://127.0.0.1:54323');
  console.log('Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres');
}

main().catch(console.error);
