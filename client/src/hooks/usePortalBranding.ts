import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PortalBranding } from "../types";

export function usePortalBranding(workspaceSlug: string) {
  return useQuery<PortalBranding>({
    queryKey: ["portal-branding", workspaceSlug],
    queryFn: () =>
      api
        .get(`/api/portal/${workspaceSlug}/branding`)
        .then((r) => r.data),
    enabled: !!workspaceSlug,
    staleTime: 5 * 60 * 1000,
  });
}
