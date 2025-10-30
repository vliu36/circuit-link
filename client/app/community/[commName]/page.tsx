"use client"
import React, { use, useState, useEffect } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../context.tsx";
import { logout } from "../../landing/landing.ts";
import { Suspense } from 'react';
import SearchResults from "../../search/searchResult.tsx";
import { useRouter} from "next/navigation";

export default function CommunityPage({
  params,
}: {
  params: Promise<{ commName: string}>
}) {
  const { commName } = use(params);
  const { user } = useAuth();
  /*const [ numUsers, setNumUsers] = useState(null);*/
  const router = useRouter();
  /*useEffect(() => {
  async function fetchData(){
  const res = await fetch(`http://localhost:2400/api/comm/${commName}`, {     
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  setNumUsers(data.numUsers);
  }
  fetchData();
  }, [commName]);*/
  

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
        <h1 className = {Styles.line}>Welcome to the {commName} community.</h1>
      </div>

      <div>
        <h2 className = {Styles.bigBox}> Look at these amazing posts, coming soon(+2 weeks) to a forum near you.</h2>
      </div>

      <div>
        <h1 className = {Styles.banner}> This is a banner</h1>
      </div>

    </div>
  )
}
