"use client"

import Styles from "./navbar.module.css";
import Link from "next/link";     
import Image from "next/image";  
import AuthButtons from "./authbuttons.tsx";   
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { authStateCallback } from "@/app/auth-observer.ts";
import { useAuth } from "@/app/context.tsx";
           
export default function NavBar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = authStateCallback((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className = {Styles.navBox}>
            <Link href="/">
                <Image className = {Styles.homeLogo} src="/circuitlinklogowback.svg" width={200} height={50} alt="Circuit Link Logo"/>
            </Link>
            <AuthButtons user={user}/>
        </div>
    )
}