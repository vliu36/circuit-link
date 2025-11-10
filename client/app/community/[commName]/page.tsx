// This page displays the main community page with groups and forums.
"use client"
import React, { use, useState, useEffect } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../_firebase/context.tsx";
import { logout } from "../../landing/landing.ts";
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchStructure, createGroup, deleteGroup, createForum, deleteForum } from "./community";
import { Community } from "../../_types/types.ts";


export default function CommunityPage({
  params,
}: {
  params: Promise<{ commName: string }>;
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
            <button onClick={logout}>Log Out</button>
          </div>
        </div>
      </div>
    
    <div style={{ padding: "1rem" }}>
      <h1>Welcome to the {community.name} community.</h1>
      <p>{community.description}</p>
      <br />

      {/* --- OWNERS, MODS, USERS --- */}
      <section>
        <h2><u>Owners</u></h2>
        <ul>
          {community.ownerList.map((owner) => 
            <li key={owner.id}>
              <Link href = {`/profile/${owner.id}`}>
                &gt;{owner.username || owner.id}
              </Link>
            </li>
          )}
        </ul>

        <h2><u>Moderators</u></h2>
        <ul>
          {community.modList.map((mod) => 
            <li key={mod.id}>
              <Link href = {`/profile/${mod.id}`}>
                &gt;{mod.username || mod.id}
              </Link>
            </li>
          )}
        </ul>

        <h2><u>Users</u></h2>
        <ul>
          {community.userList.map((u) => 
            <li key={u.id}>
              <Link href = {`/profile/${u.id}`}>
                &gt;{u.username || u.id}
              </Link>
            </li>
          )}
        </ul>
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
    </div>
  );
}