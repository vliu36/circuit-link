"use client";
// import React, {useEffect, useState} from "react";
import Styles from './landingPage.module.css';
// import { useAuth } from "./context.tsx";
// import { logout } from "./landing.ts";
import SearchBar from "./search/searchbar.tsx";
import SearchResults from "./search/searchResult.tsx";
import { useRouter } from "next/navigation";
import { Suspense } from 'react';
// import env from "dotenv";

export default function Landing() {
    // const { user, userData, loading } = useAuth();
    const router = useRouter();
    
        // const handleClick = async () => {
        //     try {
        //         // const response = await fetch("https://circuitlink-160321257010.us-west2.run.app/api/users/all"), {
        //         const response = await fetch("http://localhost:2400/api/users/all", {     
        //             method: "GET",
        //             headers: {
        //                 "Content-Type": "application/json",
        //             },
        //         });
    
        //         if (response.ok) {
        //             // window.location.href = "https://circuitlink-160321257010.us-west2.run.app/api/users/all";
        //             window.location.href = "http://localhost:2400/api/users/all";
        //         }
        //         else {
        //             console.error("Request failed due to skill issue:", response.status);
        //         }
        //     }
        //     catch (error) {
        //         console.error("Error sending request:", error);
        //     }
        // };

    return (
    
        <div className = {Styles.background}>

            <div className = {Styles.yourCommunitiesBar}>
                <h1>Your Communities</h1>
                <button className = {Styles.communitiesButtons}>
                    <img src = "plus.svg" className = {Styles.addIcon}></img>
                    <h1 className = {Styles.buttonTextforCommunities}>Add a Community</h1>
                </button>
            </div>

            <div className = {Styles.resourcesBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>Resources</h1>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/aboutUs.svg" className = {Styles.aboutUsIcon}></img>
                    <h1 className = {Styles.buttonText}>About Circuit Link</h1>
                </button>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/helpbutton.svg" className = {Styles.aboutUsIcon}></img>
                    <h1 className = {Styles.buttonText}>Get Help</h1>
                </button>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/bug.svg" className = {Styles.aboutUsIcon}></img>
                    <h1 className = {Styles.buttonText}>Report A Bug</h1>
                </button>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/rules.svg" className = {Styles.aboutUsIcon}></img>
                    <h1 className = {Styles.buttonText}>Circuit Link Rules</h1>
                </button>
            </div>

            <div className = {Styles.topUsersBar}>
                <h1>Top Users</h1>
            </div>

            <div className = {Styles.topCommunitiesBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>Top Communities</h1>
            </div>



            <div className = {Styles.navBox}>
                <div className = {Styles.homeLogo}>
                    <img src="./circuitlinklogowback.svg"></img>
                </div>
                <div className = {Styles.logInInfo}>
                    <button className = {Styles.logInSignUpButton} onClick={() => router.push("./signin")}>Log In</button>
                    <h1 className = {Styles.orText}>or</h1>
                    <button className = {Styles.logInSignUpButton} onClick={() => router.push("./register")}> Sign up</button>
                </div>
            </div>

            <div className = {Styles.searchBarArea}>
                <div className = {Styles.welcomeText}>
                    Welcome to Circuit-Link
                </div>
                <h3 className = {Styles.searchBarAlignment}>
                    <Suspense>
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