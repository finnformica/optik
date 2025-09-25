import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db/config";
import { dimUser, type DimUser } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>,
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.issues[0].message };
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: DimUser,
  supabaseUser: User,
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>,
) {
  return async (prevState: ActionState, formData: FormData) => {
    // Get authenticated Supabase user
    const supabaseUser = await getAuthenticatedUser();

    // Get user details from our database
    const [user] = await db
      .select()
      .from(dimUser)
      .where(eq(dimUser.email, supabaseUser.email!))
      .limit(1);

    if (!user) {
      throw new Error("User profile not found");
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.issues[0].message };
    }

    return action(result.data, formData, user, supabaseUser);
  };
}
