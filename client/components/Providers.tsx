"use client";

import { AuthProvider } from "@/context/AuthContext";
import { EventCommentsProvider } from "@/context/EventCommentsContext";
import { EventsProvider } from "@/context/EventsContext";
import { GroupsProvider } from "@/context/GroupsContext";
import { SocketProvider } from "@/context/SocketContext";
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
          <SocketProvider>
            <EventsProvider>
              <EventCommentsProvider>
                <TasksProvider>
                  <GroupsProvider>{children}</GroupsProvider>
                </TasksProvider>
              </EventCommentsProvider>
            </EventsProvider>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default Providers;
