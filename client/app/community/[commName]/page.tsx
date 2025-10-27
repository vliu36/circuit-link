"use client"
import React, { use } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../context.tsx";
import { logout } from "../../landing/landing.ts";

export default function CommunityPage({
  params,
}: {
  params: Promise<{ commName: string }>
}) {
  const { commName } = use(params);
  const { user } = useAuth();
 
  return (
    <div className = {Styles.background}>
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

      <div>
        <h1 className = {Styles.sideBox}> {commName}</h1>
      </div>

      <div>
        <h2 className = {Styles.bigBox}> Look at these amazing posts</h2>
      </div>

      <div>
        <h1 className = {Styles.banner}> This is a banner</h1>
      </div>

    </div>
  )
}
