"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { meData , logoutUsers } from "../lib/auth";

const AuthContext = createContext(null);

export  function AuthProvider({ children }) {
    const [user , setUser] = useState(null);
    const [loading ,setLoading] = useState(true);

    useEffect(()=>{
        const checkAuth = async() => {
            try{
                const data = await meData();
                if (data) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            }catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        checkAuth();


    },[]);


    const refreshUser = async () => {
    try {
        const res = await meData();
        setUser(res.user);
    } catch (err) {
        setUser(null);
    }
    };

    const logout = async () => {
        await logoutUsers();
        setUser(null);
  };



    return(
        <AuthContext.Provider value={{ user, loading, setUser, logout , refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
  return useContext(AuthContext);
}