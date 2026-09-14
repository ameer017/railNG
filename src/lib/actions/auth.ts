"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { isUniqueConflict } from "@/lib/prisma-errors";

const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export type AuthState = { error?: string };

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        role: "PASSENGER",
      },
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      return { error: "An account with this email already exists" };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    return { error: "Account created, but sign-in failed. Try logging in." };
  }

  return {};
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "");
  const next = callbackUrl.startsWith("/")
    ? `/signed-in?next=${encodeURIComponent(callbackUrl)}`
    : "/signed-in";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: next,
    });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    return { error: "Invalid email or password" };
  }

  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
