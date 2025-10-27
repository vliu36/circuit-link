"use client"
import React, { use } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../context.tsx";
import { logout } from "../../landing/landing.ts";
import { Suspense } from 'react';
import SearchBar from "../../search/searchbar.tsx";
import SearchResults from "../../search/searchResult.tsx";

export default function CommunityPage({
  params,
}: {
  params: Promise<{ commName: string }>
}) {
  const { commName } = use(params);
  const { user } = useAuth();
 
  return (
    <div className = {Styles.background}>
      
      <div className = {Styles.navBox}>
        <button className = {Styles.homeLogo} onClick = {() => window.location.href = "http://localhost:3000/landing"}>
          <img src="../circuitlinklogowback.svg" alt="Logo"></img>
        </button>
      </div>

      <div className = {Styles.pfpSection}>
        <button className = {Styles.notificationButton}>
          <img src = "../notifBell.svg" className = {Styles.notificationButton} onClick = {() => window.location.href = "https:www.youtube.com/watch?v=dQw4w9WgXcQ"}></img>
        </button>
      </div>

      <div className = {Styles.dropdown}>
        <div className = {Styles.pfpSection}>
          <button>
            <img src = {user?.photoURL || "../circleUser.svg"} className = {Styles.settingsIcon} alt="User profile"></img>
          </button>
          <div className = {Styles.dropdownMenu}>
            <button onClick={() => window.location.href = "http://localhost:3000/profile"}>Profile</button>
            <button>Settings</button>
            <button onClick={logout}>Log Out</button>
          </div>
        </div>
      </div>
      
      <div>
        <h1 className = {Styles.line}>{commName}</h1>
      </div>

      <div className = {Styles.communityImage}></div>

      <div>
        <h2 className = {Styles.bigBox}> Look at these amazing posts, coming soon(+2 weeks) to a forum near you</h2>
      </div>

      <div>
        <h1 className = {Styles.banner}> This is a banner</h1>
      </div>

    </div>
  )
}
