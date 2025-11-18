"use client";

import { AuthProvider } from "@/context/AuthContext";
import { EventsProvider } from "@/context/EventsContext";
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
        <EventsProvider>
          <GroupsProvider>{children}</GroupsProvider>
        </EventsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Providers;
