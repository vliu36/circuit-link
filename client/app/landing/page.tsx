"use client";
import React, {useEffect, useState} from "react";
import Styles from './landingPage.module.css';
import { useAuth } from "../context.tsx";
import { logout } from "./landing.ts";
import SearchBar from "../searchbar/searchbar.tsx";
import SearchResults from "../searchbar/searchResult.tsx";

export default function Landing() {
    const { user, userData, loading } = useAuth(); 

    return (
        <div className={Styles.background}>
        <div className = {Styles.Verticalline}></div>
        <div className = {Styles.VerticallineOne}></div>
        <div className = {Styles.VerticallineTwo}></div>
        
        <div>
            <h1 className = {Styles.textBox}>
                Welcome to Circuit-Link,
            </h1>
            <h2 className = {Styles.usernameTextBox}>
                hi{user?.displayName}
            </h2>
            <h3 className = {Styles.Searchbar}>
                <SearchBar/>
            </h3>
            <h4> 
                <SearchResults />
            </h4>
        </div>

        

        <div className={Styles.Buttoncontainer}>
            <div className = {Styles.logoBox}>
                <img src="/circuitlinklogowback.svg"></img>
            </div>
            <div className={Styles.HorizontallineOne}></div>
            <div className={Styles.Horizontalline}></div>
            <button className={Styles.ButtonStyle}>
                <img src="/home.svg" className={Styles.homelogoBox}></img>
                <div className = {Styles.buttonTextAlignment}>Home</div>   
            </button>

            <button className={Styles.ButtonStyle}>
                <img src="/friends.svg" className={Styles.homelogoBox}></img>
                <div className = {Styles.buttonTextAlignment}>Friends</div>
            </button>

            <button className={Styles.ButtonStyle}>
                <img src="/notification.svg" className={Styles.homelogoBox}></img>
                <div className = {Styles.buttonTextAlignment}>Notifications</div>
            </button>
            <img src = "/add.svg" className = {Styles.addIcon}></img>
        </div>

        <div className={Styles.Left}></div>
        <div className={Styles.Right}></div>
        
        
        
        
        
        <div className = {Styles.dropdown}>
            <button className = {Styles.dropdownIcon}><img src={user?.photoURL || "/profileIcon.svg"} className = {Styles.settingsIcon}></img></button>
            <div className = {Styles.dropdownMenu}>
                <button onClick={() => window.location.href = "http://localhost:3000/profile"}>Profile</button>
                <button>Settings</button>
                <button onClick={logout}>Log Out</button>
            </div>
        </div>
    </div>
    );
}