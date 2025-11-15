"use client"

import Styles from "./navbar.module.css";
import Link from "next/link";     
import Image from "next/image";  
import AuthButtons from "./authbuttons.tsx";   
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { authStateCallback } from "@/app/_firebase/auth-observer.ts";
import { useAuth } from "@/app/_firebase/context.tsx";
import { logout } from '../../landing.ts';
import HomeLogo from '../../../public/circuitlinklogowback.svg'
import ProfilePic from '../../../public/circleUser.svg'
import notificationBell from '../../../public/notifBell.svg'
           
export default function NavBar() {
    const [user, setUser] = useState<User | null>(null);
    const [open, setOpen] = useState(false);
    
    useEffect(() => {
        const unsubscribe = authStateCallback((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    return (
        !user ?(
        <div className = {Styles.navBox}>
                <div className = {Styles.navBox}>
                <Link href="/" replace>
                    <Image className = {Styles.homeLogo} src={HomeLogo} width={200} height={50} alt="Circuit Link Logo"/>
                </Link>
                <div className = {Styles.logInInfo}>
                    <Link className = {Styles.logInSignUpButton} href="./signin" replace> Log In </Link>
                    <h1 className = {Styles.orText}> or </h1>
                    <Link className = {Styles.logInSignUpButton} href="./register" replace> Sign Up </Link>
                </div>
            </div>
        </div>
        )
        :(
            <div className = {Styles.navBox}>
                <div className = {Styles.homeLogo}>
                    <Image src={HomeLogo} alt="Logo" width={200} height={200}></Image>
                </div>
                <div className = {Styles.logInInfo}>
                    <button>
                        <Image src = {notificationBell} alt="Info" className = {Styles.notificationButton} width={5} height={5}></Image>
                    </button>
                    <div className = {Styles.dropdown}>
                        <button><img src = {user?.photoURL || ProfilePic} className = {Styles.settingsIcon} alt="User profile" onClick={() => setOpen(prev => !prev)}></img></button>
                        {open && (
                            <div className={Styles.dropdownMenu}>
                                <Link href="./profile" replace>Profile</Link>
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