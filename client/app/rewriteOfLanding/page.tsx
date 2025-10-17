"use client";
import React, {useEffect, useState} from "react";
import Styles from './landingPage.module.css';
import { useAuth } from "../context.tsx";
import { logout } from "./landing.ts";
import SearchBar from "../searchbar/searchbar.tsx";
import SearchResults from "../searchbar/searchResult.tsx";

export default function rewriteOfLanding() {
    const { user, userData, loading } = useAuth(); 

    return (
        <div className = {Styles.background}>
            <div className = {Styles.Verticalline}></div>
            <div className={`${Styles.Verticalline} ${Styles.leftVLine}`}></div>
            <div className={`${Styles.Verticalline} ${Styles.rightVLine}`}></div>
            <div className = {`${Styles.horizontalLine} ${Styles.hline1}`}></div>

            <div className = {Styles.containSearch}>
                <div className = {Styles.textBox}>Welcome to Circuit-Link,</div>
                <div className = {Styles.usernameTextBox}>
                    henry{user?.displayName}
                </div>
                <div className = {Styles.searchBarPos}><SearchBar/></div>
                <div className = {Styles.searchOptionsPos}> <SearchResults /></div>
            </div>
        </div>
        
        
    );
}