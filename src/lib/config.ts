export function getServerEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

const requiredServices = {
  supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  inngest: ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"],
  browserbase: ["BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID"],
  gemini: ["GEMINI_API_KEY"],
} as const;

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
