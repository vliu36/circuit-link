"use client"
import React, { use, useState, useEffect } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../context.tsx";
import { logout } from "../../landing/landing.ts";
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function CommunityPage({
  params,
}: {
  params: Promise<{ commName: string}>
}) {
  const { commName } = use(params);
  const { user } = useAuth();
  /*const [ numUsers, setNumUsers] = useState(null);*/
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
        <Link className = {Styles.homeLogo} href = "./landing" replace>
          <Image src="../circuitlinklogowback.svg" alt="Logo" width={200} height = {200}></Image>
        </Link>
      </div>

      <div className = {Styles.pfpSection}>
        <button className = {Styles.notificationButton}>
          <Image src = "../notifBell.svg" alt = "Notif" width = {5} height = {5}></Image>
        </button>
      </div>

      <div className = {Styles.dropdown}>
        <div className = {Styles.pfpSection}>
          <button>
            <Image src = {user?.photoURL || "../circleUser.svg"} className = {Styles.settingsIcon} width = {5} height = {5} alt="User profile"></Image>
          </button>
          <div className = {Styles.dropdownMenu}>
            <Link href = "./profile" replace>Profile</Link>
            <button>Settings</button>
            <script onClick={logout}>Log Out</script>
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
