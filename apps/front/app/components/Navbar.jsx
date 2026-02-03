"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from "../../context/authContext";
import { useRouter } from 'next/navigation';

const Navbar = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const logout2 = async () => {
        logout();
        router.push("/login");
    };

    return (
        <nav className="bg-gray-100 border-b border-gray-300 px-6 py-3 shadow-sm font-sans flex justify-end items-center">
            <div className="flex items-center space-x-4">
                <div className="px-2 py-1">
                    <Link href="/book" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">
                        Book
                    </Link>
                </div>

                <div className="px-2 py-1">
                    <Link href="/myTables" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">
                        My Tables
                    </Link>
                </div>

                {user && user.role === 'admin' && (
                    <div className="px-2 py-1">
                        <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">
                            Admin
                        </Link>
                    </div>
                )}

                {user && (
                    <div className="px-2 py-1">
                        <button
                            onClick={logout2}
                            className="text-sm font-medium text-red-600 hover:text-red-800 transition"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;