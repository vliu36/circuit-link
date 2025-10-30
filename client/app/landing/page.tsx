"use client";
// import React, {useEffect, useState} from "react";
import Styles from './landingPage.module.css';
import { useAuth } from "../context.tsx";
import { Suspense } from 'react';
import SearchBar from "../_components/searchbar/search.tsx";
import SearchResults from "../_components/searchbar/table.tsx";

export default function Landing() {
    const { user } = useAuth();
    
    return (
    
        <div className = {Styles.background}>

            <div className = {Styles.yourCommunitiesBar}>
                <h1>  Your Communities</h1>
                <button className = {Styles.communitiesButtons}>
                    <img src = "plus.svg" className = {Styles.addIcon} alt="Add icon"></img>
                    <h1 className = {Styles.buttonTextforCommunities}>Add a Community</h1>
                </button>
            </div>

            <div className = {Styles.resourcesBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>  Resources</h1>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/aboutUs.svg" className = {Styles.aboutUsIcon} alt="About us icon"></img>
                    <h1 className = {Styles.buttonText}>About Circuit Link</h1>
                </button>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/helpbutton.svg" className = {Styles.aboutUsIcon} alt="Question mark"></img>
                    <h1 className = {Styles.buttonText}>Get Help</h1>
                </button>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/bug.svg" className = {Styles.aboutUsIcon} alt="Bug icon"></img>
                    <h1 className = {Styles.buttonText}>Report A Bug</h1>
                </button>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/rules.svg" className = {Styles.aboutUsIcon} alt="Book icon"></img>
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



            {/* <div className = {Styles.navBox}>
                <div className = {Styles.homeLogo}>
                    <img src="./circuitlinklogowback.svg" alt="Logo"></img>
                </div>
                <div className = {Styles.logInInfo}>
                    <button>
                        <img src = "./notifBell.svg" className = {Styles.notificationButton}></img>
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
            </div> */}

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