"use client"
import React, { use, useState, useEffect } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../context.tsx";
import { logout } from "../../landing/landing.ts";
// import { Suspense } from 'react';
// import { useRouter} from "next/navigation";
import { Community, fetchStructure } from "./community.ts";
import Link from "next/link";

export default function CommunityPage({
  params,
}: {
  params: Promise<{ commName: string}>
}) {
  const { commName } = use(params);
  const { user } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStructure(commName)
      .then((data) => {
        if (data) setCommunity(data);
      })
      .finally(() => setLoading(false));
  }, [commName]);

  if (loading) return <div>Loading community...</div>;
  if (!community) return <div>Community not found.</div>;

  /*const [ numUsers, setNumUsers] = useState(null);*/
  // const router = useRouter();
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
        {/* Display all groups and forums in the community */}
        {community.groupsInCommunity.map((group) => (
          <div key={group.id}>
            <h2>{group.name}</h2>
            <ul>
              {group.forumsInGroup.map((forum) => (
                <li key={forum.id}>
                  <Link href={`/community/${commName}/${forum.slug}`}>
                    {forum.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
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
