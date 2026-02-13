"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { createQueryClient } from "@/lib/state/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerRegistration />
      {children}
    </QueryClientProvider>
  );
}
