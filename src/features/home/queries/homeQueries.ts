import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

function getSessionEmailFallback(): string {
  if (supabase === null) {
    return "Supabase is not configured.";
  }

  return "No active session.";
}

export const helloQueryOptions = queryOptions({
  queryKey: ["hello"],
  queryFn: (): Promise<string> => Promise.resolve("React Query is working."),
});

export const sessionQueryOptions = queryOptions({
  queryKey: ["supabase-session"],
  queryFn: async (): Promise<string> => {
    if (supabase === null) {
      return getSessionEmailFallback();
    }

    const { data } = await supabase.auth.getSession();
    const email = data.session?.user.email;

    if (email === undefined) {
      return getSessionEmailFallback();
    }

    return email;
  },
});
