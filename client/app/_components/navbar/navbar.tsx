"use client"

import Styles from "./navbar.module.css";
import Link from "next/link";     
import Image from "next/image";  
import AuthButtons from "./authbuttons.tsx";   
import { useEffect, useState, useRef } from "react";
import { User } from "firebase/auth";
import { authStateCallback } from "@/app/_firebase/auth-observer.ts";
import { useAuth } from "@/app/_firebase/context.tsx";
import { logout } from '../../OldDefault/landing.ts';
import HomeLogo from '../../../public/CircuitLinkHomeLogo.svg'
import ProfilePic from '../../../public/circleUser.svg'
import notificationBell from '../../../public/notification.svg'
           
export default function NavBar() {
    const [user, setUser] = useState<User | null>(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
             }
        }
        if (isNotifOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isNotifOpen]);

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

    useEffect(() => {
        function handleProfileClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleProfileClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleProfileClickOutside);
        };
    }, [isDropdownOpen]);

    const toggleNotif = () => {
        setIsNotifOpen(prev => !prev);
        setIsDropdownOpen(false); // Close profile
    };

    const toggleProfile = () => {
        setIsDropdownOpen(prev => !prev);
        setIsNotifOpen(false); // Close notifs
    };

    return (
        !user ?(
        <div className = {Styles.navBox}>
            <div style={{gridArea: 'Home'}}>
                <Link href="/" replace>
                    <Image className = {Styles.homeLogo} src={HomeLogo} width={200} height={50} alt="Circuit Link Logo"/>
                </Link>
            </div>
                
            <div className = {Styles.logInInfo} style={{gridArea: 'login'}}>
                    <Link className = {Styles.logInSignUpButton} href="./signin" replace> Log In </Link>
                    <h1 className = {Styles.orText}> or </h1>
                    <Link className = {Styles.logInSignUpButton} href="./register" replace> Sign Up </Link>
            </div>
            <div className={Styles.line} style={{gridArea: 'line'}}></div>
        </div>
        )
        :(
            <div className = {Styles.navBox}>
                {/*user signed in*/}
                <div className = {Styles.homeLogo} style={{gridArea: 'Home'}}>
                    <Link href="/" replace>
                        <Image src={HomeLogo} alt="Logo" width={200} height={200}></Image>
                    </Link>
                </div>
                <div className = {Styles.logInInfo} style={{gridArea: 'login'}}>
                    <div className = {Styles.notifDropdown} ref = {notifRef}>
                        <button onClick={() => setIsNotifOpen(prev => !prev)}>
                             <Image src = "./notification.svg" alt="Info" className = {Styles.notificationButton} width={5} height={5}></Image>
                        </button>
                          {isNotifOpen && (
                            <div className = {Styles.notifDropdownMenu}>
                                <Link href = "http://localhost:3000/profile/notifications" replace>Notifications</Link>
                            </div>
                            )}
                    </div>
                    <div className = {Styles.dropdown} ref = {dropdownRef}>
                        <button onClick={() => setIsDropdownOpen(prev => !prev)}>
                            <Image src = {user?.photoURL || "/circleUser.svg"} className = {Styles.settingsIcon} alt="User profile" width = {10} height = {10}></Image>
                        </button>
                          {isDropdownOpen && (
                            <div className = {Styles.dropdownMenu}>
                                <Link href = "http://localhost:3000/profile" replace>Profile</Link>
                                <button style = {{color:'black'}}>Settings</button>
                                <button style = {{color:'black'}}onClick={logout}>Log Out</button>
                            </div>
                            )}
                    </div>
                </div>
                <div className={Styles.line} style={{gridArea: 'line'}}>
                </div>
                <div className={Styles.line} style={{gridArea: 'line'}}></div>
            </div>
            
        )
    )
}