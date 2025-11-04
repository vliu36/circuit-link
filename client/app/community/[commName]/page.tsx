"use client"
import React, { use, useState, useEffect } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../_firebase/context.tsx";
import { logout } from "../../landing/landing.ts";
// import { Suspense } from 'react';
// import { useRouter} from "next/navigation";
import { fetchStructure, createGroup, deleteGroup, createForum, deleteForum } from "./community.ts";
import { Community } from "../../_types/types.ts";
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

  const [groupName, setGroupName] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [forumInputs, setForumInputs] = useState<{ [groupId: string]: { name: string; description: string; message: string } }>({});

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

  

  // --- CREATE GROUP ---
  const handleCreateGroup = async () => {
    if (!user) {
      return;
    }
    const result = await createGroup(commName, groupName, user.uid);
    setGroupMessage(result.message);
    setGroupName("");
    // Refresh community structure after creating a group
    fetchStructure(commName).then((data) => data && setCommunity(data));
  };
  
  // --- DELETE GROUP ---
  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;
    try {
      const result = await deleteGroup(groupId);
      console.log("Group deleted successfully:", result);
    } catch (err) {
      console.error("Error deleting group:", err);
    }
  };

  // --- CREATE FORUM ---
  const handleCreateForum = async (groupId: string) => {
    if (!user) return;

    const { name, description } = forumInputs[groupId] || { name: "", description: "", message: "" };
    if (!name || !description) {
      setForumInputs((prev) => ({ ...prev, [groupId]: { ...prev[groupId], message: "Name and description are required." } }));
      return;
    }

    try {
      const forumId = await createForum({
        name,
        description,
        userId: user.uid,
        groupId,
        commName,
      });
      setForumInputs((prev) => ({ ...prev, [groupId]: { name: "", description: "", message: "Forum created successfully!" } }));

      // Refresh community structure
      fetchStructure(commName).then((data) => data && setCommunity(data));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create forum.";

      setForumInputs((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          message,
        },
      }));
    }
  };

  // --- DELETE FORUM ---
  const handleDeleteForum = async (forumId: string) => {
    if (!user) return;
    try {
      const result = await deleteForum(forumId, user.uid);
      console.log("Forum deleted successfully:", result);
    } catch (err) {
      console.error("Error deleting forum:", err);
    }
  };

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

    // ---------------------------------------------------------------- Old Design ---------------------------------------------------------------- //
    // ---------------------------------------------------- Commented out so I can see clearer ---------------------------------------------------- //
    
    // <div className = {Styles.background}>
      
    //   <div className = {Styles.navBox}>
    //     <button className = {Styles.homeLogo} onClick = {() => window.location.href = "http://localhost:3000/landing"}>
    //       <img src="../circuitlinklogowback.svg" alt="Logo"></img>
    //     </button>
    //   </div>

    //   <div className = {Styles.pfpSection}>
    //     <button className = {Styles.notificationButton}>
    //       <img src = "../notifBell.svg" className = {Styles.notificationButton} onClick = {() => window.location.href = "https:www.youtube.com/watch?v=dQw4w9WgXcQ"}></img>
    //     </button>
    //   </div>

    //   <div className = {Styles.dropdown}>
    //     <div className = {Styles.pfpSection}>
    //       <button>
    //         <img src = {user?.photoURL || "../circleUser.svg"} className = {Styles.settingsIcon} alt="User profile"></img>
    //       </button>
    //       <div className = {Styles.dropdownMenu}>
    //         <button onClick={() => window.location.href = "http://localhost:3000/profile"}>Profile</button>
    //         <button>Settings</button>
    //         <button onClick={logout}>Log Out</button>
    //       </div>
    //     </div>
    //   </div>
      
    //   <div>
    //     <h1 className = {Styles.line}>Welcome to the {commName} community.</h1>
    //     {/* Display all groups and forums in the community */}
    //     {community.groupsInCommunity.map((group) => (
    //       <div key={group.id}>
    //         <h2>{group.name}</h2>
    //         <ul>
    //           {group.forumsInGroup.map((forum) => (
    //             <li key={forum.id}>
    //               <Link href={`/community/${commName}/${forum.slug}`}>
    //                 {forum.name}
    //               </Link>
    //             </li>
    //           ))}
    //         </ul>
    //       </div>
    //     ))}
    //   </div>

    //   <div>
    //     <h2 className = {Styles.bigBox}> Look at these amazing posts, coming soon(+2 weeks) to a forum near you.</h2>
    //   </div>

    //   <div>
    //     <h1 className = {Styles.banner}> This is a banner</h1>
    //   </div>

    // </div>

    // ---------------------------------------------------------------- End of old Design ---------------------------------------------------------------- //

    // ---------------------------------------------------------------- Simple HTML for Community Demo ---------------------------------------------------------------- //
    
    <div style={{ padding: "1rem" }}>
      <h1>Welcome to the {community.name} community.</h1>
      <p>{community.description}</p>
      <br />

      {/* --- OWNERS, MODS, USERS --- */}
      <section>
        <h2><u>Owners</u></h2>
        <ul>{community.ownerList.map((owner) => <li key={owner.id}>&gt;{owner.username || owner.id}</li>)}</ul>

        <h2><u>Moderators</u></h2>
        <ul>{community.modList.map((mod) => <li key={mod.id}>&gt;{mod.username || mod.id}</li>)}</ul>

        <h2><u>Users</u></h2>
        <ul>{community.userList.map((u) => <li key={u.id}>&gt;{u.username || u.id}</li>)}</ul>
      </section>
      <br />

      {/* --- GROUPS AND FORUMS --- */}
      <section>
        <h2><u>Groups</u></h2>
        {community.groupsInCommunity.length === 0 && <p>No groups in this community yet.</p>}
        <p>----------------------------------------------------------------------------------------------------------------------------------------------------------------</p>
        {/* Displays a group and its forums */}
        {community.groupsInCommunity.map((group) => (
          <div key={group.id} style={{ marginBottom: "2rem" }}>
            <h3>{group.name}</h3>
            <button onClick={() => handleDeleteGroup(group.id)}>[Delete Group &apos;{group.name}&apos;]</button>
            <br/><br/>

            {/* Displays the forums in this group */}
            {group.forumsInGroup.length > 0 ? (
              <ul>
                {group.forumsInGroup.map((forum) => (
                  <li key={forum.id}>
                    {/* Link to the forum (displays its posts) */}
                    <Link href={`/community/${commName}/${forum.slug}`}>
                      &gt;{forum.name}
                    </Link>
                    {/* -------- Delete Forum Button -------- */}
                    <button style={{ marginLeft: "2rem" }} onClick={() => handleDeleteForum(forum.id)}>[Delete &apos;{forum.name}&apos;]</button>
                  </li>
                ))}
              </ul>
            ) : <p>No forums in this group.</p>}

            {/* --- CREATE FORUM FORM --- */}
            <div style={{ marginTop: "1rem" }}>
              <h4>Create a new forum in {group.name}</h4>
              {/* -------- Forum Name -------- */}
              <input
                type="text"
                placeholder="Forum name"
                value={forumInputs[group.id]?.name || ""}
                onChange={(e) => setForumInputs((prev) => ({
                  ...prev,
                  [group.id]: { ...prev[group.id], name: e.target.value, message: "" },
                }))}
              />
              {/* -------- Forum Description -------- */}
              <input
                type="text"
                placeholder="Forum description"
                value={forumInputs[group.id]?.description || ""}
                onChange={(e) => setForumInputs((prev) => ({
                  ...prev,
                  [group.id]: { ...prev[group.id], description: e.target.value, message: "" },
                }))}
              />
              {/* -------- Submit -------- */}
              <button onClick={() => handleCreateForum(group.id)}>Create Forum</button>
              {forumInputs[group.id]?.message && <p>{forumInputs[group.id].message}</p>}
            </div>
            <p>----------------------------------------------------------------------------------------------------------------------------------------------------------------</p>
          </div>
        ))}
      </section>

      {/* --- CREATE GROUP FORM --- */}
      <div style={{ marginTop: "2rem" }}>
        <h3>Create a new group in {commName}</h3>
        <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" />
        <button onClick={handleCreateGroup}>Create Group</button>
        {groupMessage && <p>{groupMessage}</p>}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <p>Logged in as: {user?.displayName || user?.email}</p>
      </div>
    </div>
    
  )
}
