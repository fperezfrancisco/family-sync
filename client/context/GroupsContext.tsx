"use client";
import React, { createContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { Group } from "@/types/groups";
import { GroupsAPI } from "@/lib/api";

interface GroupResponse extends Response {
  group?: Group;
  message?: string;
}

interface GroupsContextType {
  // Define the shape of your groups context here
  groups: Group[];
  loading: boolean;
  createNewGroup: (data: {
    name: string;
    description?: string;
    type: string;
  }) => Promise<void | GroupResponse>;
  deleteGroup: (groupId: string) => Promise<void | GroupResponse>;
}

const GroupsContext = createContext<GroupsContextType | null>(null);

export function GroupsProvider({ children }: { children: React.ReactNode }) {
  // Groups context state and methods would go here
  const { user } = useAuth();
  // global state variables
  const [loading, setLoading] = useState<boolean>(false);
  const [groups, setGroups] = useState<Group[]>([]);

  const createNewGroup = async ({
    name,
    description,
    type,
  }: {
    name: string;
    description?: string;
    type: string;
  }) => {
    const response: GroupResponse = await GroupsAPI.create({
      name,
      description,
      type,
    });
    if (response.group) {
      const newGroup = response.group;
      setGroups((prev) => [...prev, newGroup]);
      return response;
    }
  };

  const deleteGroup = async (groupId: string) => {
    const response: GroupResponse = await GroupsAPI.deleteGroup(groupId);
    if (response.status === 200) {
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      return response;
    }
  };

  useEffect(() => {
    // Fetch groups when user changes
    (async () => {
      if (user) {
        setLoading(true);
        // fetch groups from api
        const respone = await GroupsAPI.getMine();
        setGroups(respone.groups);
        setLoading(false);
      } else {
        setGroups([]);
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <GroupsContext.Provider
      value={{ groups, loading, createNewGroup, deleteGroup }}
    >
      {children}
    </GroupsContext.Provider>
  );
}

export const useGroups = () => {
  const context = React.useContext(GroupsContext);
  if (!context) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
};
