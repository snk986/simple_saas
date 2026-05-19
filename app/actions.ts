"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { ensureCustomerInitialized } from "@/lib/auth/ensure-customer-initialized";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import { mapAuthErrorToKey } from "@/lib/auth/error-map";

function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

function getLocale(formData: FormData) {
  const locale = formData.get("locale")?.toString();
  return locale && isLocale(locale) ? locale : defaultLocale;
}

function localizedPath(locale: Locale, path: string) {
  return `${localePrefix(locale)}${path}`;
}

function safeRedirectPath(value: FormDataEntryValue | null) {
  const path = value?.toString();

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  return path;
}

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const locale = getLocale(formData);
  const supabase = await createClient();
  const origin =
    (await headers()).get("origin") ??
    process.env.BASE_URL ??
    "http://localhost:3000";
  const signUpPath = localizedPath(locale, "/sign-up");
  const homePath = localizedPath(locale, "/");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      signUpPath,
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?redirect_to=${encodeURIComponent(homePath)}`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", signUpPath, mapAuthErrorToKey(error));
  } else {
    return encodedRedirect("success", homePath, "Thanks for signing up!");
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = safeRedirectPath(formData.get("redirectTo"));
  const locale = getLocale(formData);
  const supabase = await createClient();
  const signInPath = redirectTo
    ? `${localizedPath(locale, "/sign-in")}?redirectTo=${encodeURIComponent(redirectTo)}`
    : localizedPath(locale, "/sign-in");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", signInPath, mapAuthErrorToKey(error));
  }

  if (data.user?.id) {
    try {
      await ensureCustomerInitialized(data.user.id, data.user.email, "sign_in");
    } catch (ensureError) {
      console.error("Failed to ensure customer initialization on sign in:", ensureError);
    }
  }

  return redirect(redirectTo ?? localizedPath(locale, "/"));
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const locale = getLocale(formData);
  const supabase = await createClient();
  const origin =
    (await headers()).get("origin") ??
    process.env.BASE_URL ??
    "http://localhost:3000";
  const callbackUrl = formData.get("callbackUrl")?.toString();
  const forgotPasswordPath = localizedPath(locale, "/forgot-password");
  const resetPasswordPath = localizedPath(locale, "/dashboard/reset-password");

  if (!email) {
    return encodedRedirect("error", forgotPasswordPath, "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=${encodeURIComponent(resetPasswordPath)}`,
  });

  if (error) {
    console.error(error.message);
    const mappedError = mapAuthErrorToKey(error);
    const errorKey =
      mappedError === "authErrors.generic"
        ? "authErrors.forgotPasswordFailed"
        : mappedError;

    return encodedRedirect("error", forgotPasswordPath, errorKey);
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    forgotPasswordPath,
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const locale = getLocale(formData);
  const resetPasswordPath = localizedPath(locale, "/dashboard/reset-password");

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      resetPasswordPath,
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect("error", resetPasswordPath, "Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect("error", resetPasswordPath, "Password update failed");
  }

  encodedRedirect("success", resetPasswordPath, "Password updated");
};

export const signOutAction = async (formData?: FormData) => {
  const locale = formData ? getLocale(formData) : defaultLocale;
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect(localizedPath(locale, "/sign-in"));
};
