/**
 * Session hooks for the UI. The only way components learn about auth state.
 */

import { useQuery } from "@tanstack/react-query"
import { fetchSession } from "../services/auth/auth.service"

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => fetchSession(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
}
