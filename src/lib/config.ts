export function getServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

const requiredServices = {
  supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  database: ["DATABASE_URL"],
  inngest: ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"],
  browserbase: ["BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID"],
  gemini: ["GEMINI_API_KEY"],
} as const;

/** Public base URL used in emails and absolute links. */
export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function getEmailConfig() {
  return {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM ?? "Sentinel <onboarding@resend.dev>",
  };
}

export function getGitHubToken() {
  return process.env.GITHUB_TOKEN || undefined;
}

export function hasSupabaseAuthConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getServiceConfig() {
  return Object.fromEntries(
    Object.entries(requiredServices).map(([service, variables]) => [
      service,
      variables.every((variable) => Boolean(process.env[variable])),
    ]),
  ) as Record<keyof typeof requiredServices, boolean>;
}

export function getMissingServiceVariables() {
  return Object.values(requiredServices).flatMap((variables) =>
    variables.filter((variable) => !process.env[variable]),
  );
}

export function hasExternalServicesConfigured() {
  return getMissingServiceVariables().length === 0;
}

export function getMissingRunIntakeVariables() {
  return ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"]
    .filter((variable) => !process.env[variable]);
}

export function hasRunIntakeConfigured() {
  return getMissingRunIntakeVariables().length === 0;
}
