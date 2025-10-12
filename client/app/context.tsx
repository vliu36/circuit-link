/** This makes the logged in user available app-wide via React Context so we don't have to keep calling onAuthStateChanged in every component
 *  
 */
"use client";
import React, { createContext, use, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// Define the shape of the context value
interface AuthContextType {
    user: User | null;
    userData: any | null; // You can define a more specific type based on your user data structure
    loading: boolean
} 

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true
});

// Define props for AuthProvider
interface AuthProviderProps {
    children: ReactNode;
}

// AuthProvider component to wrap the app and provide auth state
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Fetch additional user data from backend 
                const docRef = doc(db, "Users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    console.log("No such document!");
                    setUserData(null);
                } // end if else
            } else {
                setUserData(null);
            } // end if else
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);