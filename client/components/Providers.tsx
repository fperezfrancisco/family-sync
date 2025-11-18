"use client";

import { AuthProvider } from "@/context/AuthContext";
import { GroupsProvider } from "@/context/GroupsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ProvidersProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const Providers = ({ children }: ProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GroupsProvider>{children}</GroupsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Providers;
