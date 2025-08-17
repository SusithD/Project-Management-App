// Demo mode utility functions

// Check if demo mode is enabled
export function isDemoMode(): boolean {
  return (
    process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development"
  );
}

// Get demo user from request headers or query params
export function getDemoUserFromRequest(event: any): string | null {
  const headers = getHeaders(event);
  const query = getQuery(event);

  // Check for demo user in headers or query params
  const demoUser = headers["x-demo-user"] || query.demoUser;

  if (
    demoUser &&
    typeof demoUser === "string" &&
    demoUser.includes("@demo.com")
  ) {
    return demoUser;
  }

  return null;
}

// Check if a user email is a demo user
export function isDemoUserEmail(email: string): boolean {
  return Boolean(email && email.includes("@demo.com"));
}

/**
 * Get demo-aware JIRA base URL
 */
export function getDemoJiraBaseUrl(): string {
  return "https://demo-company.atlassian.net";
}

/**
 * Get the appropriate JIRA base URL based on mode and user
 */
export function getJiraBaseUrl(userEmail?: string): string {
  const demoMode = isDemoMode();
  const isDemoUser = userEmail && isDemoUserEmail(userEmail);

  if (demoMode && isDemoUser) {
    return getDemoJiraBaseUrl();
  }

  // Return production JIRA URL from runtime config
  const config = useRuntimeConfig();
  return config.public.jira?.baseUrl || config.jira?.baseUrl || "";
}

// Get demo mode status for API responses
export function getDemoModeInfo() {
  return {
    isDemoMode: isDemoMode(),
    message: "This is a demo environment with sample data",
  };
}
