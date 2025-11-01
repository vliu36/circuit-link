"use client"
// import React, {useEffect, useState} from "react";
import Styles from './landingPage.module.css';
import { useAuth } from "../_firebase/context.tsx";
import { Suspense } from 'react';
import SearchBar from "../_components/searchbar/search.tsx";
import SearchResults from "../_components/searchbar/table.tsx";
import { useRouter } from 'next/navigation';
import { logout } from './landing.ts';
import Image from 'next/image';

export default function Landing() {
    const { user } = useAuth();
    const router = useRouter();
    
    return (
    
        <div className = {Styles.background}>

            <div className = {Styles.yourCommunitiesBar}>
                <h1>  Your Communities</h1>
                <button className = {Styles.communitiesButtons}>
                    <Image src = "plus.svg" className = {Styles.addIcon} alt="Add icon" width={5} height={5}></Image>
                    <h1 className = {Styles.buttonTextforCommunities}>Add a Community</h1>
                </button>
            </div>

            <div className = {Styles.resourcesBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>  Resources</h1>
                <button className ={Styles.resourcesBarButtons} onClick={() => router.push("/aboutus")}>
                    <Image src = "/aboutUs.svg" className = {Styles.aboutUsIcon} alt="About us icon" width={5} height={5}></Image>
                    <h1 className = {Styles.buttonText}>About Circuit Link</h1>
                </button>
                <button className ={Styles.resourcesBarButtons} onClick={() => router.push("/help")}>
                    <Image src = "/helpbutton.svg" className = {Styles.aboutUsIcon} alt="Question mark" width={5} height={5}></Image>
                    <h1 className = {Styles.buttonText}>Get Help</h1>
                </button>
                <button className ={Styles.resourcesBarButtons} onClick={() => router.push("/bugreports")}>
                    <Image src = "/bug.svg" className = {Styles.aboutUsIcon} alt="Bug icon" width={5} height={5}></Image>
                    <h1 className = {Styles.buttonText}>Report A Bug</h1>
                </button>
                <button className ={Styles.resourcesBarButtons} onClick={() => router.push("/siterules")}>
                    <Image src = "/rules.svg" className = {Styles.aboutUsIcon} alt="Book icon" width={5} height={5}></Image>
                    <h1 className = {Styles.buttonText}>Circuit Link Rules</h1>
                </button>
            </div>

            <div className = {Styles.topUsersBar}>
                <h1>Top Users</h1>
            </div>

            <div className = {Styles.topCommunitiesBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>  Top Communities</h1>
            </div>



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
                            <button onClick={() => window.location.href = "http://localhost:3000/profile"}>Profile</button>
                            <button>Settings</button>
                            <button onClick={logout}>Log Out</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className = {Styles.searchBarArea}>
                <div className = {Styles.welcomeText}>
                    Welcome to Circuit-Link,
                </div>
                <div className = {Styles.usernameText}>
                    {user?.displayName}
                </div>
                <h3 className = {Styles.searchBarAlignment}>
                    <Suspense fallback={<div>Loading search bar...</div>}>
                        <SearchBar/>
                    </Suspense>
                </h3>
                <h4> 
                    <SearchResults />
                </h4>
            </div>
        </div>
        
    );
}