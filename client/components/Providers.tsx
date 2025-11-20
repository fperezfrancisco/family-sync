"use client";

import { AuthProvider } from "@/context/AuthContext";
import { EventsProvider } from "@/context/EventsContext";
import { GroupsProvider } from "@/context/GroupsContext";
import { TasksProvider } from "@/context/TasksContext";
import { ToastProvider } from "@/context/ToastContext";
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
        <ToastProvider>
          <EventsProvider>
            <TasksProvider>
              <GroupsProvider>{children}</GroupsProvider>
            </TasksProvider>
          </EventsProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Providers;
