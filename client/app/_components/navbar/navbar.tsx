"use client"

import Styles from "./navbar.module.css";
import Link from "next/link";     
import Image from "next/image";  
import AuthButtons from "./authbuttons.tsx";   
import { useEffect, useState, useRef } from "react";
import { User } from "firebase/auth";
import { authStateCallback } from "@/app/_firebase/auth-observer.ts";
import { useAuth } from "@/app/_firebase/context.tsx";
import { logout } from '../../landing.ts';
           
export default function NavBar() {
    const [user, setUser] = useState<User | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = authStateCallback((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        // Add listener when dropdown is open
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        // Cleanup listener
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        !user ?(
        <div className = {Styles.navBox}>
                <Link href = "http://localhost:3000/landing" replace>
                    <Image className = {Styles.homeLogo} src="/circuitlinklogowback.svg" width={200} height={50} alt="Circuit Link Logo"/>
                </Link>
                <div className = {Styles.logInInfo}>
                    <Link className = {Styles.logInSignUpButton} href="./signin" replace> Log In </Link>
                    <h1 className = {Styles.orText}> or </h1>
                    <Link className = {Styles.logInSignUpButton} href="./register" replace> Sign Up </Link>
                </div>
        </div>
        )
        :(
            <div className = {Styles.navBox}>
                <Link href = "http://localhost:3000/landing" replace>
                    <Image className = {Styles.homeLogo} src="./circuitlinklogowback.svg" alt="Logo" width={200} height={200}>
                    </Image>
                </Link>
                <div className = {Styles.logInInfo}>
                    <button>
                        <Image src = "./notification.svg" alt="Info" className = {Styles.notificationButton} width={5} height={5}></Image>
                    </button>
                    <div className = {Styles.dropdown} ref = {dropdownRef}>
                        <button onClick={() => setIsDropdownOpen(prev => !prev)}>
                            <Image src = {user?.photoURL || "/circleUser.svg"} className = {Styles.settingsIcon} alt="User profile" width = {10} height = {10}></Image>
                        </button>
                          {isDropdownOpen && (
                            <div className = {Styles.dropdownMenu}>
                                <Link href = "./profile" replace>Profile</Link>
                                <button>Settings</button>
                                <button onClick={logout}>Log Out</button>
                            </div>
                            )}
                    </div>
                </div>
            </div>
            
        )
    )
}