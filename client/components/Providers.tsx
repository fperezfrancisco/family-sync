"use client";

import { AuthProvider } from "@/context/AuthContext";
import { GroupsProvider } from "@/context/GroupsContext";

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <AuthProvider>
      <GroupsProvider>{children}</GroupsProvider>
    </AuthProvider>
  );
};

export default Providers;
