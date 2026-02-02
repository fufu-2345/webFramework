"use client"

import { useState } from "react";
import { registerUsers } from "../../lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from 'sweetalert2';

export default function page() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await registerUsers({ username, email, password });
            console.log("Registration successful:", res);
            Swal.fire({
                icon: 'success',
                title: 'Registration Successful',
                text: 'You have registered successfully. Please login.',
            });
            router.push("/login");

        }
        catch (err) {
            setError(err.message || "Registration failed");
        }
        finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="text-center">Registering...</div>;
    }
    return (
        <>
            <div className="flex min-h-screen items-center justify-center">
                <div className="border-gray-300 border-2 p-10  rounded-lg shadow-lg">
                    <h1 className="font-bold text-2xl text-center">Register </h1>
                    <form className="flex flex-col mt-4" onSubmit={handleSubmit}>
                        <input type="text" placeholder="username" required className="border p-2 rounded mt-4 w-full" value={username} onChange={(e) => setUsername(e.target.value)} />
                        <input type="email" placeholder="Email" required className="border p-2 rounded mt-4 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <input type="password" placeholder="Password" required className="border p-2 rounded mt-4 w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-4 w-full">{loading ? "Registering..." : "Register"}</button>
                        <div className="mt-4">
                            {error && (
                                <p className="text-red-500 text-sm text-center mt-2">
                                    {error}
                                </p>
                            )}
                        </div>
                    </form>
                    <p className="text-sm text-center mt-4">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-500 hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}