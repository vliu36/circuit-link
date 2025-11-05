"use client"

import Styles from "./navbar.module.css";
import Link from "next/link";     
import Image from "next/image";  
import AuthButtons from "./authbuttons.tsx";   
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { authStateCallback } from "@/app/auth-observer.ts";
import { useAuth } from "@/app/context.tsx";
import { logout } from '../../landing.ts';
           
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
            if(!user?){
                <div className = {Styles.navBox}>
                <Link href="/" replace>
                    <Image className = {Styles.homeLogo} src="/circuitlinklogowback.svg" width={200} height={50} alt="Circuit Link Logo"/>
                </Link>
                <div className = {Styles.logInInfo}>
                    <Link className = {Styles.logInSignUpButton} href="./signin" replace> Log In </Link>
                    <h1 className = {Styles.orText}> or </h1>
                    <Link className = {Styles.logInSignUpButton} href="./register" replace> Sign Up </Link>
                </div>
            </div>
            }
            else{
                <div className = {Styles.navBox}>
                <div className = {Styles.homeLogo}>
                    <Image src="./circuitlinklogowback.svg" alt="Logo" width={200} height={200}></Image>
                </div>
                <div className = {Styles.logInInfo}>
                    <button>
                        <Image src = "./notifBell.svg" alt="Info" className = {Styles.notificationButton} width={5} height={5}></Image>
                    </button>
                    <div className = {Styles.dropdown}>
                        <button><img src = {user?.photoURL || "/circleUser.svg"} className = {Styles.settingsIcon} alt="User profile"></img></button>
                        <div className = {Styles.dropdownMenu}>
                            <Link href = "./profile" replace>Profile</Link>
                            <button>Settings</button>
                            <button onClick={logout}>Log Out</button>
                        </div>
                    </div>
                </div>
            </div>
            }
        </div>
    )
}