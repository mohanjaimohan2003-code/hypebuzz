type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
};

function requireEnvironmentVariable(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  value: string | undefined,
) {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseEnvironment(): SupabaseEnvironment {
  const url = requireEnvironmentVariable(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const publishableKey = requireEnvironmentVariable(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  try {
    new URL(url);
  } catch {
    throw new Error(
      "Invalid environment variable: NEXT_PUBLIC_SUPABASE_URL must be a valid URL",
    );
  }

  return { url, publishableKey };
}
