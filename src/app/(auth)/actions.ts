"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  validatedAction,
  validatedActionWithUser,
} from "@/lib/auth/middleware";
import { db } from "@/lib/db/config";
import { dimAccount, dimUser, type NewDimUser } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { paths } from "@/lib/utils";

const signInSchema = z.object({
  email: z.email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data) => {
  const { email, password } = data;

  // First, check if user exists in our database and get their account info
  const [foundUser] = await db
    .select({
      id: dimUser.id,
      accountKey: dimAccount.accountKey,
    })
    .from(dimUser)
    .innerJoin(dimAccount, eq(dimUser.id, dimAccount.userId))
    .where(eq(dimUser.email, email))
    .limit(1);

  if (!foundUser) {
    return {
      error: "Invalid email or password. Please try again.",
      email,
      password,
    };
  }

  // Sign in with Supabase
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Check if the error is due to unconfirmed email
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Please confirm your email address before signing in. Check your email for a confirmation link.",
        email,
        password,
      };
    }

    return {
      error: "Invalid email or password. Please try again.",
      email,
      password,
    };
  }

  // Update user metadata with account key
  await supabase.auth.updateUser({
    data: { accountKey: foundUser.accountKey },
  });

  redirect(paths.dashboard);
});

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.email("Invalid email address"),
  password: z.string().min(8),
});

export const signUp = validatedAction(signUpSchema, async (data) => {
  const { firstName, lastName, email, password } = data;

  // Check if user already exists in our database
  const [existingUser] = await db
    .select()
    .from(dimUser)
    .where(eq(dimUser.email, email))
    .limit(1);

  if (existingUser) {
    return {
      error:
        "An account with this email already exists. Please sign in instead.",
      firstName,
      lastName,
      email,
      password,
    };
  }

  // Sign up with Supabase Auth
  const supabase = await createClient();
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.BASE_URL}${paths.auth.signIn}`,
    },
  });

  if (signUpError) {
    // Check if email already exists
    if (signUpError.code === "email_exists") {
      return {
        error:
          "An account with this email already exists. Please sign in instead.",
        firstName,
        lastName,
        email,
        password,
      };
    }

    return {
      error: signUpError.message,
      firstName,
      lastName,
      email,
      password,
    };
  }

  if (!authData.user) {
    return {
      error: "Failed to create user. Please try again.",
      firstName,
      lastName,
      email,
      password,
    };
  }

  // Create user record in our database
  const newUser: NewDimUser = {
    firstName,
    lastName,
    email,
    role: "basic",
  };

  const [createdUser] = await db.insert(dimUser).values(newUser).returning();

  if (!createdUser) {
    return {
      error: "Failed to create user profile. Please try again.",
      firstName,
      lastName,
      email,
      password,
    };
  }

  // Create a default account for the new user
  const [createdAccount] = await db
    .insert(dimAccount)
    .values({
      userId: createdUser.id,
      accountName: `${firstName}'s Account`,
      accountType: "INDIVIDUAL",
      currency: "USD",
    })
    .returning();

  // Update user metadata with account key
  await supabase.auth.updateUser({
    data: { accountKey: createdAccount.accountKey },
  });

  redirect(paths.dashboard);
});

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(paths.auth.signIn);
}

const updatePasswordSchema = z.object({
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user, supabaseUser) => {
    const { newPassword, confirmPassword } = data;

    if (confirmPassword !== newPassword) {
      return {
        newPassword,
        confirmPassword,
        error: "New password and confirmation password do not match.",
      };
    }

    // Update password with Supabase Auth
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        newPassword,
        confirmPassword,
        error: error.message,
      };
    }

    return {
      success: "Password updated successfully.",
    };
  }
);

const deleteAccountSchema = z.object({
  confirmDelete: z.string().refine((val) => val === "DELETE", {
    message: "Please type DELETE to confirm account deletion",
  }),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user, supabaseUser) => {
    // First, soft delete from our database to retain user data
    await db
      .update(dimUser)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', extract(epoch from now()), '-deleted')`, // Ensure email uniqueness
      })
      .where(eq(dimUser.email, user.email));

    // Then delete user from Supabase Auth (this will automatically sign them out)
    const supabase = await createClient();
    const { error } = await supabase.auth.admin.deleteUser(supabaseUser.id);

    if (error) {
      return {
        confirmDelete: "",
        error: "Failed to delete account. Please try again.",
      };
    }

    redirect(paths.auth.signIn);
  }
);

const updateAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.email("Invalid email address"),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user, supabaseUser) => {
    const { firstName, lastName, email } = data;

    // Update user metadata in Supabase
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      email: email,
      data: {
        firstName,
        lastName,
        accountKey: supabaseUser.user_metadata?.accountKey, // Preserve existing account key
      },
    });

    if (error) {
      return {
        firstName,
        lastName,
        email,
        error: error.message,
      };
    }

    // Also update in our database for consistency
    await db
      .update(dimUser)
      .set({ firstName, lastName, email })
      .where(eq(dimUser.id, user.id));

    return { firstName, lastName, success: "Account updated successfully." };
  }
);
