"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { mutations: { retry: 1 } } }));
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster theme="dark" richColors />
    </QueryClientProvider>
  );
}
