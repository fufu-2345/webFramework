"use client";


import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUsers, meData } from "../../lib/auth";
import { useAuth } from "../../context/authContext";



export default function LoginPage() {
  const router =  useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error , setError] = useState("");
  const [loading , setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading (true);
    try{
      await loginUsers({email, password});
      const me = await meData();
      refreshUser();
      router.push("/dashboard");
    }
    catch (err){
      setError(err.message || "Login failed");
      
    }
    finally{
      setLoading(false);
    }
  }
 

 

  return (
    <>
      <div className="flex min-h-screen items-center justify-center">
          <div className="border p-8 rounded-lg shadow-lg">
            <h1 className="font-bold text-2xl text-center">Login</h1>
            <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
              <input type="email" placeholder="Email" className="border p-2 rounded" onChange={(e) => setEmail(e.target.value) }  required/>
              <input type="password" placeholder="Password" className="border p-2 rounded" onChange={(e) => setPassword(e.target.value)}  required/>
              <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600" > {loading ? "Logging in..." : "Login"}</button>
              
            </form>
            <div className="mt-4">
              {error && (
              <p className="text-red-500 text-sm text-center mt-2">
                {error}
              </p>)}
              <p className="text-sm text-center">
                Don't have an account? <Link href="/register" className="text-blue-500 hover:underline">Register</Link>
              </p>
            </div>
          </div>
          

      </div>
    </>
  );
}
