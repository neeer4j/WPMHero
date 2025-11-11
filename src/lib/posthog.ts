import { PostHog } from "posthog-node";

import { env } from "@/lib/env";

let client: PostHog | null = null;

export const getPosthog = () => {
  if (!env.POSTHOG_KEY) {
    return null;
  }

  if (!client) {
    client = new PostHog(env.POSTHOG_KEY, {
      host: env.POSTHOG_HOST ?? "https://app.posthog.com",
    });
  }

  return client;
};
