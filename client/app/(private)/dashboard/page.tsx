"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import React from "react";

//type Props = {};

const Page = () => {
  const { logout, user } = useAuth();
  const router = useRouter();

  return (
    <div className="flex w-full flex-col">
      <h1> Welcome to your Dashboard </h1>
      <button className="p-4 border border-neutral-200" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

export default Page;
