// This page displays the main community page with groups and forums.
"use client"
import React, { use, useState, useEffect } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../_firebase/context.tsx";
import { logout } from "../../landing/landing.ts";
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import * as commApi from "./community";
import { Community } from "../../_types/types.ts";
import { useRouter } from "next/navigation";
import NavBar from '../../_components/navbar/navbar.tsx';



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

  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    commApi.fetchStructure(commName)
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
    const result = await commApi.createGroup(commName, groupName, user.uid);
    setGroupMessage(result.message);
    setGroupName("");
    // Refresh community structure after creating a group
    // commApi.fetchStructure(commName).then((data) => data && setCommunity(data));
    refreshCommunity();
  };
  
  // --- DELETE GROUP ---
  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;
    try {
      const result = await commApi.deleteGroup(groupId, commName);
      console.log("Group deleted successfully:", result);
      await refreshCommunity();
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
      const forumId = await commApi.createForum({
        name,
        description,
        userId: user.uid,
        groupId,
        commName,
      });
      setForumInputs((prev) => ({ ...prev, [groupId]: { name: "", description: "", message: "Forum created successfully!" } }));

      // Refresh community structure
      // commApi.fetchStructure(commName).then((data) => data && setCommunity(data));
      refreshCommunity();
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

  // Refresh the current community structure and update state
  const refreshCommunity = async () => {
    try {
      const updated = await commApi.fetchStructure(commName);
      if (updated) {
        setCommunity(updated);
      } else {
        console.error("Failed to refresh community: no data returned");
      }
    } catch (err) {
      console.error("Error refreshing community:", err);
    }
  };

  // --- DELETE FORUM ---
  const handleDeleteForum = async (forumId: string) => {
    if (!user) return;
    try {
      const result = await commApi.deleteForum(forumId, commName);
      console.log("Forum deleted successfully:", result);
      await refreshCommunity();
    } catch (err) {
      console.error("Error deleting forum:", err);
    }
  };

  // --- DELETE COMMUNITY ---
  const handleDeleteComm = async (commName: string) => {
    if (!confirm(`Are you sure you want to delete "${commName}"? This action cannot be undone.`)) {
      return;
    }

    await commApi.deleteCommunity(commName);
    console.log("Community successfully deleted.");
    router.push("/landing");
  }

  // --- JOIN THE COMMUNITY ---
  const handleJoin = async () => {
    const res = await commApi.joinCommunity(commName);
    console.log(res.message);
    await refreshCommunity(); 
  };

  // --- LEAVE THE COMMUNITY ---
  const handleLeave = async () => {
    const res = await commApi.leaveCommunity(commName);
    console.log(res.message);
    await refreshCommunity();
  };

  // --- PROMOTE USER TO MOD ---
  const handlePromoteToMod = async (userId: string) => {
    const res = await commApi.promoteToMod(commName, userId);
    console.log(res.message);
    await refreshCommunity();
  };

  // --- DEMOTE MOD TO USER ---
  const handleDemoteMod = async (userId: string) => {
    const res = await commApi.demoteMod(commName, userId);
    console.log(res.message);
    await refreshCommunity();
  };

  // --- PROMOTE USER TO OWNER ---
  const handlePromoteToOwner = async (userId: string) => {
    const res = await commApi.promoteToOwner(commName, userId);
    console.log(res.message);
    await refreshCommunity();
  };

  // --- DEMOTE OWNER ---
  const handleDemoteOwner = async (userId: string) => {
    const res = await commApi.demoteOwner(commName, userId);
    console.log(res.message);
    await refreshCommunity();
  };

  const isMember = community.userList.some(u => u.id === user?.uid);
  const isMod = community.modList.some(m => m.id === user?.uid);
  const isOwner = community.ownerList.some(o => o.id === user?.uid);

  return (
    <div className = {Styles.background}>
      <div>
        <NavBar/>
      </div>

      <div className = {Styles.yourCommunitiesBar}>
        <h1>Your Communities</h1>
          <button className = {Styles.communitiesButtons}>
            <img src = "plus.svg" className = {Styles.addIcon}></img>
            <h1 className = {Styles.buttonTextforCommunities}>Add a Community</h1>
          </button>
      </div>

            
      <div className = {Styles.serverBar}>
        <div className = {Styles.horizontalLine}></div>
        <h1>{commName}</h1>
        <div className = {Styles.horizontalLine}></div>
        <div className = {Styles.serverContainer}>
          {/* --- GROUPS AND FORUMS --- */}
          <section>
            {community.groupsInCommunity.length === 0 && <p>No groups in this community yet.</p>}
          
            {/* Displays a group and its forums */}
            {community.groupsInCommunity.map((group) => (
              <div key={group.id} style={{ marginBottom: "2rem"}}>
                <div className = {Styles.groupHeader}>
                  <div className = {Styles.groupName}>{group.name}</div>
                  {/* Only displays if user is an owner or a mod */}
                  {(isOwner || isMod) &&
                    <button className = {Styles.deleteGroup} onClick={() => handleDeleteGroup(group.id)}>
                      Delete Group
                    </button>
                  }
                </div>
                

                {/* Displays the forums in this group */}
                {group.forumsInGroup.length > 0 ? (
                  <div>
                    {group.forumsInGroup.map((forum) => (
                    <div key={forum.id} className = {Styles.channelHeader}>
                      {/* Link to the forum (displays its posts) */}
                      <div className = {Styles.channelName}>
                        <Link href={`/community/${commName}/${forum.slug}`}>
                          &gt;{forum.name}
                        </Link>
                      </div>
                      {/* -------- Delete Forum Button -------- */}
                      {/* Only shows if user is owner or mod */}
                      {(isOwner || isMod) && 
                        <button className = {Styles.deleteChannel} onClick={() => handleDeleteForum(forum.id)}>
                          Delete Forum
                        </button>
                      }
                    </div>
                    ))}
                    
                  </div>
                ) : <p>No forums in this group.</p>}

                {/* --- CREATE FORUM FORM --- */}
                <div className = {Styles.createForumContainer} style={{ marginTop: "1rem" }}>
                  <h4>Create a new forum in {group.name}</h4>

                  {/* -------- Forum Name -------- */}
                  <input
                    type="text"
                    placeholder="Forum name"
                    className = {Styles.forumCreationInfomation}
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
                    className = {Styles.forumDescCreationInfomation}
                    value={forumInputs[group.id]?.description || ""}
                    onChange={(e) => setForumInputs((prev) => ({
                      ...prev,
                      [group.id]: { ...prev[group.id], description: e.target.value, message: "" },
                    }))}
                  />

                  {/* -------- Submit -------- */}
                  <button className = {Styles.createForumButton} onClick={() => handleCreateForum(group.id)}>Create Forum</button>
                  {forumInputs[group.id]?.message && <p>{forumInputs[group.id].message}</p>}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      <div className = {Styles.channelInfoBox}>
        <div className = {Styles.channelInfoh1}>{commName}</div>
        <div className = {Styles.channelInfoh2}>{community?.description}</div>
      </div>
            
      <div className = {Styles.RightBar}>
        <div className = {Styles.horizontalLine}></div>

        <div className = {Styles.RulesBar}>
          Rules
        </div>
        
        
        
        
        {/* Displays the list of users in the community */}
        <div className = {Styles.usersBar}>
          <div className = {Styles.channelInfoh1}>
            <div className = {Styles.horizontalLine1}></div>
            User Information
          </div>
            {/* --- OWNERS, MODS, USERS --- */}
            <div>
              <h2><u>Owners</u></h2>
              <ul>
                {/* Display each owner */}
                {community.ownerList.map((owner) => 
                  <li key={owner.id}>
                    <Link href={`/profile/${owner.id}`}>
                      &gt;{owner.username || owner.id}
                    </Link>

                    {/* If current user is an owner, display demote owner button */}
                    {isOwner && owner.id !== user?.uid && (
                      <button style={{ marginLeft: "0.5rem" }} onClick={() => handleDemoteOwner(owner.id)}>
                        [Demote Owner]
                      </button>
                    )}
                  </li>
                )}
              </ul>

              <h2><u>Moderators</u></h2>
              <ul>
                {/* Display each moderator */}
                {community.modList.map((mod) => 
                  <li key={mod.id}>
                    <Link href={`/profile/${mod.id}`}>
                      &gt;{mod.username || mod.id}
                    </Link>

                    {/* If current user is an owner, display buttons to promote or demote a mod */}
                    {isOwner && !community.ownerList.some(o => o.id === mod.id) && (
                    <>
                      <button style={{ marginLeft: "0.5rem" }} onClick={() => handlePromoteToOwner(mod.id)}>
                        [Promote to Owner]
                      </button>
                      <button style={{ marginLeft: "0.5rem" }} onClick={() => handleDemoteMod(mod.id)}>
                        [Demote Mod]
                      </button>
                    </>
                    )}
                  </li>
                )}
              </ul>

              <h2><u>Users</u></h2>
              <ul>
                {/* Display each user */}
                {community.userList.map((u) => 
                <li key={u.id}>
                  <Link href={`/profile/${u.id}`}>
                    &gt;{u.username || u.id}
                  </Link>

                  {/* If current user is an owner, display buttons to promote user to a mod or owner */}
                  {isOwner && !community.modList.some(m => m.id === u.id) && !community.ownerList.some(o => o.id === u.id) && (
                  <>
                    <button style={{ marginLeft: "0.5rem" }} onClick={() => handlePromoteToMod(u.id)}>
                      [Promote to Mod]
                    </button>
                    <button style={{ marginLeft: "0.5rem" }} onClick={() => handlePromoteToOwner(u.id)}>
                      [Promote to Owner]
                    </button>
                  </>
                  )}
                </li>
                )}
              </ul>

              </div>
          </div>
        </div>

      <div className = {Styles.centerPage}>
        <div className = {Styles.bannerBox}></div>
        <div className = {Styles.titleBox}>
          <div className = {Styles.serverIcon}></div>
          <div className = {Styles.titleText}>{community.name}</div>
          {/* If not member, show Join button, otherwise show Leave Button */}
          {!isMember ? (
            <button className = {Styles.joinCommunityButton} onClick={handleJoin}>Join Community</button>
            ) : (
            <button className={Styles.joinCommunityButton} onClick={handleLeave}>Leave Community</button>
          )}
        </div>
        <div className = {Styles.blackLine}> </div>
        
        <div style={{ padding: "1rem" }}>
        {/* Displays community name and description */}
        
        <p style={{ marginTop: "1rem", marginLeft: "10%"}}>{community.description}</p>

        

        {/* If current user is an owner, show DELETE COMMUNITY button */}
        {isOwner && (
          <div style={{ marginTop: "1rem", marginLeft: "10%"}}>
            <button onClick={() => handleDeleteComm(community.name)}>
              [DELETE COMMUNITY]
            </button>
          </div>
        )}


        
        

        {/* --- CREATE GROUP FORM --- */}
        <div style={{ marginTop: "2rem", marginLeft: "10%"}}>
          <h3>Create a new group in {commName}</h3>
          <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" />
          <button onClick={handleCreateGroup}>Create Group</button>
          {groupMessage && <p>{groupMessage}</p>}
        </div>

        <div style={{ marginTop: "2rem", marginLeft: "10%"}}>
          <p>Logged in as: {user?.displayName || user?.email}</p>
        </div>
      </div>
    </div>
  </div>
  );
}