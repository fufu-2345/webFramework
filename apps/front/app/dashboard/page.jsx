"use client";

import {  useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/authContext";


export default function page() {

    const { user, loadingStatus , logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loadingStatus && !user) {
        router.push("/login");
    }
    },[user, loadingStatus, router]);

    if (loadingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

  


    return (
        <>
           <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-4">
                    Dashboard
                </h1>

                <p className="text-gray-700">
                    Welcome, <span className="font-semibold">{user.username}</span>
                </p>

                <p className="mt-2 text-sm text-gray-500">
                    Email: {user.email}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                    Role: {user.role}
                </p>
                <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={logout}> 
                    Logout
                </button>
        </div>
        </>
    );



}