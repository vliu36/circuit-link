// This page displays the main community page with groups and forums.
"use client"
import React, { use, useState, useEffect } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../_firebase/context.tsx";
import { logout } from "../../landing.ts";
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
  const [error, setError] = useState<string | null>(null);

  const [groupName, setGroupName] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [forumInputs, setForumInputs] = useState<{ [groupId: string]: { name: string; description: string; message: string } }>({});
  const [targetUserId, setTargetUserId] = useState<string>("");

  // Popup boolean states for edit community, change icon, change banner, kick/ban user, and show blacklist
  const [editOpen, setEditOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [showCreateForum, setShowCreateForum] = useState<{ [key: string]: boolean }>({});
  const [modOptionsOpen, setModOptionsOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);

  // Files and previews for changing icon and banner
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);


  // setEditGroupDetails
  const [editGroupId, setEditGroupId] = useState<string>("");



  const toggleEditPopup = () => {
    setEditOpen(!editOpen);
    setError(null);
  }

  const toggleIconPopup = () => {
    setIconOpen(!iconOpen);
    setError(null);
  };
  const toggleBannerPopup = () => {
    setBannerOpen(!bannerOpen);
    setError(null);
  };

  const toggleEditGroupPopup = () => {
    setEditGroupOpen(!editGroupOpen);
    setError(null);
  };

  const toggleModOptionsPopup = () => {
    setModOptionsOpen(!modOptionsOpen);
    setError(null);
  };

  const toggleBlacklistPopup = () => {
    setBlacklistOpen(!blacklistOpen);
    setError(null);
  };

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
    const result = await commApi.createGroup(commName, groupName);
    setGroupMessage(result.message);
    setGroupName("");
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

  const handleCreateForumBox = async (groupId: string) => {
    setShowCreateForum({});
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
        groupId,
        commName,
      });
      setForumInputs((prev) => ({ ...prev, [groupId]: { name: "", description: "", message: "" } }));

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
        // TODO: This causes an error when changing the community name; refreshing returns no data because the old name is used
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

  // --- EDIT COMMUNITY ---
  const handleEditCommunity = async (newName?: string, description?: string, isPublic?: boolean, rules?: string) => {
    try {
      const res = await commApi.editCommunity(commName, newName, description, isPublic, rules);
      console.log(res.message);
      setError(res.message || null);
      if (res.status === "ok" && newName && newName.toLowerCase() !== commName.toLowerCase()) {
        router.push(`/community/${newName}`);
      } else if (res.status === "ok") {
        // Close the edit popup only if the name hasn't changed
        toggleEditPopup();
        await refreshCommunity();
      }
    } catch (err) {
      setError("Failed to edit community. Please try again.");
      console.error("Error editing community:", err);
    }
  };

  // --- EDIT GROUP ---
  const handleEditGroup = async (groupId: string, newName: string) => {
    try {
      const res = await commApi.editGroup(commName, groupId, newName);
      console.log(res.message);
      setError(res.message || null);
      await refreshCommunity();
      if (res.status === "ok") {
        toggleEditGroupPopup();
      }
    } catch (err) {
      console.error("Error editing group:", err);
    }
  };

  // Handle file selection
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIconFile(file);
    if (file) setIconPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBannerFile(file);
    if (file) setBannerPreview(URL.createObjectURL(file));
  };

  // --- Handle file submission ---
  // Submission for icon
  const submitIcon = async () => {
    if (!iconFile) return;
    try {
      await commApi.changeCommunityIcon(iconFile, community.id);
      toggleIconPopup();
      setIconFile(null);
      setIconPreview(null);
      await refreshCommunity();
    } catch (err) {
      console.error("Failed to upload icon:", err);
    }
  };

  // Submission for banner
  const submitBanner = async () => {
    if (!bannerFile) return;
    try {
      await commApi.changeCommunityBanner(bannerFile, community.id);
      toggleBannerPopup();
      setBannerFile(null);
      setBannerPreview(null);
      await refreshCommunity();
    } catch (err) {
      console.error("Failed to upload banner:", err);
    }
  };

  // Handle kick
  const handleKickUser = async () => {
    try {
      const res = await commApi.kickMember(commName, targetUserId);
      console.log(res.message);
      setError(res.message || null);
      // Wait 1 second and close the popup
      setTimeout(() => {
        toggleModOptionsPopup();
      }, 1000);
      await refreshCommunity();
    } catch (err) {
      console.error("Failed to kick user:", err);
    }
  };

  // Handle ban
  const handleBanUser = async () => {
    try {
      const res = await commApi.banMember(commName, targetUserId);
      console.log(res.message);
      setError(res.message || null);
      // Wait 1 second and close the popup
      setTimeout(() => {
        toggleModOptionsPopup();
      }, 1000);
      await refreshCommunity();
    } catch (err) {
      console.error("Failed to ban user:", err);
    }
  };

  // Handle unban
  const handleUnbanUser = async (targetUserId: string) => {
    try {
      const res = await commApi.unbanMember(commName, targetUserId);
      console.log(res.message);
      setError(res.message || null);
      // Wait 1 second and close the popup
      setTimeout(() => {
        toggleBlacklistPopup();
      }, 1000);
      await refreshCommunity();
    } catch (err) {
      console.error("Failed to unban user:", err);
    }
  };


  const isMember = community.userList.some(u => u.id === user?.uid);
  const isMod = community.modList.some(m => m.id === user?.uid);
  const isOwner = community.ownerList.some(o => o.id === user?.uid);
  const isBanned = community.blacklist.some(b => b.id === user?.uid);

  // If the user is banned, show a message and do not render the community page
  if (isBanned) {
    return <div>You are banned from this community.</div>;
  }

  return (
    <main>
      <div className={Styles.background}>


        <div className={Styles.yourCommunitiesBar} style={{ gridArea: "CommunitiesBar" }}>
          <h1>Your Communities</h1>
          <button className={Styles.communitiesButtons}>
            <img src="plus.svg" className={Styles.addIcon}></img>
            <h1 className={Styles.buttonTextforCommunities}>Add a Community</h1>
          </button>
        </div>


        <div className={Styles.serverBar} style={{ gridArea: "ServerBar" }}>
          <div>{commName}</div>
          <div className={Styles.horizontalLine}></div>
          <div className={Styles.serverContainer}>
            {/* --- GROUPS AND FORUMS --- */}
            <section>
              {community.groupsInCommunity.length === 0 && <p>No groups in this community yet.</p>}

              {/* Displays a group and its forums */}
              {community.groupsInCommunity.map((group) => (
                <div key={group.id} style={{ marginBottom: "2rem" }}>
                  <div className={Styles.groupHeader}>
                    <div className={Styles.groupName}>{group.name}</div>
                    <button
                          className={Styles.plusButton}
                          onClick={() =>
                            setShowCreateForum(() => ({
                              // close ALL popups, only toggle the one clicked
                              [group.id]: !showCreateForum[group.id]
                            }))
                          }
                        >
                          +
                        </button>
                        {/* --- CREATE FORUM FORM (only shown if toggled on) --- */}
                        {showCreateForum[group.id] && (
                          <div className={Styles.createForumContainer} style={{ marginTop: "1rem" }}>
                            <h4 className={Styles.createForumText}>Create a new forum in {group.name}</h4>

                            {/* -------- Forum Name -------- */}
                            <input
                              type="text"
                              placeholder="Forum name"
                              className={Styles.forumCreationInfomation}
                              value={forumInputs[group.id]?.name || ""}
                              onChange={(e) =>
                                setForumInputs((prev) => ({
                                  ...prev,
                                  [group.id]: {
                                    ...prev[group.id],
                                    name: e.target.value,
                                    message: "",
                                  },
                                }))
                              }
                            />

                            {/* -------- Forum Description -------- */}
                            <textarea
                              placeholder="Type description here"
                              className={Styles.forumDescCreationInfomation}
                              value={forumInputs[group.id]?.description || ""}
                              onChange={(e) =>
                                setForumInputs((prev) => ({
                                  ...prev,
                                  [group.id]: { ...prev[group.id], description: e.target.value, message: "" },
                                }))
                              }
                            />

                            {/* -------- Submit -------- */}
                            <button
                              className={Styles.createForumButton}
                              onClick={() => {
                                handleCreateForumBox(group.id);
                                handleCreateForum(group.id);
                              }}
                            >
                              Create Forum
                            </button>

                            {forumInputs[group.id]?.message && (
                              <p>{forumInputs[group.id].message}</p>
                            )}
                          </div>
                        )}
                    {/* Only displays if user is an owner or a mod */}
                    {
                      (isOwner || isMod) &&
                      <>
                        <button className={Styles.deleteGroup} onClick={() => handleDeleteGroup(group.id)}>
                          Delete
                        </button>
                        <button className={Styles.editGroup} onClick={() => { toggleEditGroupPopup(); setEditGroupId(group.id); }}>
                          Edit
                        </button>
                        
                      </>
                    }
                  </div>

                  {/* Displays the forums in this group */}
                  {group.forumsInGroup.length > 0 ? (
                    <div>
                      {group.forumsInGroup.map((forum) => (
                        <div key={forum.id} className={Styles.channelHeader}>
                          {/* Link to the forum (displays its posts) */}
                          <div className={Styles.channelName}>
                            <Link href={`/community/${commName}/${forum.slug}`}>
                              &gt;{forum.name}
                            </Link>
                          </div>
                          {/* -------- Delete Forum Button -------- */}
                          {/* Only shows if user is owner or mod */}
                          {(isOwner || isMod) &&
                            <button className={Styles.deleteChannel} onClick={() => handleDeleteForum(forum.id)}>
                              Delete Forum
                            </button>
                          }
                        </div>
                      ))}

                    </div>
                  ) : <p>No forums in this group.</p>}
                </div>
              ))}
            </section>
          </div>
        </div>



        <div className={Styles.RightBar} style={{ gridArea: "RightBar" }}>
          <div className={Styles.channelInfoBox}>
            <div className={Styles.channelInfoh1}>{commName}</div>
            <div className={Styles.channelInfoh2}>{community?.description}</div>
          </div>
          <div className={Styles.horizontalLine}></div>

          <div className={Styles.RulesBar}>
            Rules
          </div>



          <div className={Styles.horizontalLine1}></div>

          {/* Displays the list of users in the community */}
          <div className={Styles.usersBar}>
            <div className={Styles.channelInfoh1}>
              User Information

              {/* If current user is mod/owner, display button to toggle show blacklist */}
              {(isOwner || isMod) && (
                <button style={{ marginLeft: "0.5rem" }} onClick={toggleBlacklistPopup}>
                  [Show Blacklist]
                </button>
              )}
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

                    {/* If current user is an owner, display demote owner button and mod options */}
                    {isOwner && owner.id !== user?.uid && (
                      <>
                        <button style={{ marginLeft: "0.5rem" }} onClick={() => handleDemoteOwner(owner.id)}>
                          [Demote Owner]
                        </button>
                        <button style={{ marginLeft: "0.5rem" }} onClick={() => { toggleModOptionsPopup(); setTargetUserId(owner.id); }}>
                          [Mod Options]
                        </button>
                      </>
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

                    {/* If current user is an owner and the listed mod is not an owner, display buttons to promote or demote a mod and mod options */}
                    {isOwner && !community.ownerList.some(o => o.id === mod.id) && (
                      <>
                        <button style={{ marginLeft: "0.5rem" }} onClick={() => handlePromoteToOwner(mod.id)}>
                          [Promote to Owner]
                        </button>
                        <button style={{ marginLeft: "0.5rem" }} onClick={() => handleDemoteMod(mod.id)}>
                          [Demote Mod]
                        </button>
                        <button style={{ marginLeft: "0.5rem" }} onClick={() => { toggleModOptionsPopup(); setTargetUserId(mod.id); }}>
                          [Mod Options]
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

                    {/* If current user is an owner and the listed user is not a mod or owner; display buttons to promote user to a mod or owner */}
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
                    {/* If current user is an owner or mod and the listed user is not a mod or owner, show mod options button */}
                    {(isOwner || isMod) && !community.modList.some(m => m.id === u.id) && !community.ownerList.some(o => o.id === u.id) && (
                      <button style={{ marginLeft: "0.5rem" }} onClick={() => { toggleModOptionsPopup(); setTargetUserId(u.id); }}>
                        [Mod Options]
                      </button>
                    )}
                  </li>
                )}
              </ul>

            </div>
          </div>
        </div>

        <div className={Styles.centerPage} style={{ gridArea: "Center" }}>
          <div className={Styles.firstBox}>
            <div className={Styles.bannerBox}>
              {/* --- COMMUNITY BANNER --- -------- Click on banner, if mod/owner, to change the banner */}
              {(isOwner || isMod) ? (
                <button
                  className={Styles.bannerBox}
                  onClick={toggleBannerPopup}
                  style={{ padding: 0, border: 'none', background: 'none', display: 'inline-block' }}
                >
                  <Image
                    src={community.banner}
                    alt="Community Banner"
                    width={800}
                    height={200}
                    className={Styles.bannerBox}
                    style={{ display: 'block' }}
                  />
                </button>
              ) : (
                <Image
                  src={community.banner}
                  alt="Community Banner"
                  width={800}
                  height={200}
                  className={Styles.bannerBox}
                />
              )}
            </div>

            <div className={Styles.titleBox}>
              {/* --- COMMUNITY ICON --- -------- Click on image, if mod/owner, to change the icon */}
              <div className={Styles.serverIcon}>
                {/* If user is an owner or mod, allow them to change the icon */}
                {isOwner || isMod ? (
                  <button
                    className={Styles.editIconButton}
                    onClick={toggleIconPopup}
                    style={{ padding: 0, border: 'none', background: 'none' }}
                  >
                    <Image
                      src={community.icon || "/default_icon.png"}
                      alt="Community Icon"
                      width={200}
                      height={100}
                      className={Styles.serverIcon}
                    />
                  </button>
                ) : (
                  // Otherwise, just display the icon
                  <Image
                    src={community.icon}
                    alt="Community Icon"
                    width={100}
                    height={100}
                    className={Styles.serverIcon}
                  />
                )}

              </div>
              <div className={Styles.titleText}>
                {community.name || commName}
                {/* Button that toggles edit community popup */}
                {isOwner && (
                  <button className={Styles.editCommunityButton} onClick={toggleEditPopup}>
                    Edit
                  </button>
                )}
              </div>
              {/* If not member, show Join button, otherwise show Leave Button */}
              {!isMember ? (
                <button className={Styles.joinCommunityButton} onClick={handleJoin}>Join Community</button>
              ) : (
                <button className={Styles.joinCommunityButton} onClick={handleLeave}>Leave Community</button>
              )}
            </div>
          </div>



          <div>
            {/* Displays community name and description */}


            {/* If current user is an owner, show DELETE COMMUNITY button */}
            {isOwner && (
              <div style={{ marginTop: "1rem", marginLeft: "10%" }}>
                <button onClick={() => handleDeleteComm(community.name)}>
                  [DELETE COMMUNITY]
                </button>
              </div>
            )}

            {/* --- CREATE GROUP FORM --- */}
            <div className={Styles.createBox}>
              <p style={{ marginTop: "1rem", marginLeft: "10%" }}>{community.description}</p>

              <div style={{ marginTop: "2rem", marginLeft: "10%" }}>
                <h3>Create a new group in {commName}</h3>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" />
                <button onClick={handleCreateGroup}>Create Group</button>
                {groupMessage && <p>{groupMessage}</p>}
              </div>

              <div style={{ marginTop: "2rem", marginLeft: "10%" }}>
                <p>Logged in as: {user?.displayName || user?.email}</p>
              </div>
            </div>

          </div>
        </div>

        <div className={Styles.navBox} style={{ gridArea: "NavBar" }}>
          <NavBar />
        </div>

      </div>
      {/* --- EDIT COMMUNITY POPUP --- */}
      {editOpen && (
        <div className={Styles.popupOverlay} onClick={toggleEditPopup}>
          <div className={Styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={Styles.popupText}>Edit Community</h2>
            {/* Form for editing the communiuty */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newName = formData.get("newName") as string;
              const description = formData.get("description") as string;
              const isPublic = formData.get("isPublic") === "on" ? true : false;
              const rules = formData.get("rules") as string;
              await handleEditCommunity(newName || undefined, description || undefined, isPublic, rules || undefined);
            }}>
              <label className={Styles.popupText}>
                New Name: <br />
                <input
                  type="text"
                  name="newName"
                  defaultValue={community.name}
                  className={`${Styles.popupText} ${Styles.inputField}`}
                  maxLength={24}
                  pattern="^[a-zA-Z0-9_-]+$"
                  title="24 characters max. Name can only contain letters, numbers, underscores, and hyphens."
                />
              </label>
              <br /><br />
              <label className={Styles.popupText}>
                Description: <br />
                <textarea
                  name="description"
                  className={`${Styles.popupText} ${Styles.inputField}`}
                  defaultValue={community.description}
                  maxLength={100}
                  title="100 characters max."
                />
              </label>
              <br /><br />
              <label className={Styles.popupText}>
                Rules: <br />
                <textarea
                  name="rules"
                  className={`${Styles.popupText} ${Styles.inputField}`}
                  defaultValue={community.rules}
                  maxLength={200}
                  title="200 characters max."
                />
              </label>
              <br /><br />
              <label className={Styles.popupText}>
                Public:{" "}
                <input
                  type="checkbox"
                  name="isPublic"
                  defaultChecked={community.public}
                />
              </label>
              <br /><br />
              {error && <p style={{ color: "yellow" }}>{error}</p>}
              <br />
              <button type="submit" className={`${Styles.popupText} ${Styles.saveBtn}`}>Save Changes</button>
            </form>
            <button className={` ${Styles.closeBtn} ${Styles.popupText}`} onClick={toggleEditPopup}>
              Close
            </button>
          </div>
        </div>
      )}
      {/* --- EDIT GROUP POPUP --- */}
      {editGroupOpen && (
        <div className={Styles.popupOverlay} onClick={toggleEditGroupPopup}>
          <div className={Styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={Styles.popupText}>Edit Group</h2>

            {/* Form for editing the group */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newName = formData.get("newName") as string;
              const groupId = editGroupId;

              await handleEditGroup(groupId, newName);
            }}>
              <label className={Styles.popupText}>
                New Name: <br />
                <input
                  type="text"
                  name="newName"
                  className={`${Styles.popupText} ${Styles.inputField}`}
                  maxLength={24}
                  pattern="^[a-zA-Z0-9_-]+$"
                  title="24 characters max. Name can only contain letters, numbers, underscores, and hyphens."
                  required
                />
              </label>
              <br /><br />
              {error && <p style={{ color: "yellow" }}>{error}</p>}
              <br />
              <button type="submit" className={`${Styles.popupText} ${Styles.saveBtn}`}>Save Changes</button>
            </form>
            <button className={` ${Styles.closeBtn} ${Styles.popupText}`} onClick={toggleEditGroupPopup}>
              Close
            </button>
          </div>
        </div>
      )}
      {/* --- ICON POPUP --- */}
      {iconOpen && (
        <div className={Styles.popupOverlay} onClick={toggleIconPopup}>
          <div className={Styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={Styles.popupText}>Change Community Icon</h2>

            {/* Preview the uploaded image */}
            {iconPreview && (
              <div style={{ marginBottom: "1rem" }}>
                <Image src={iconPreview} alt="Preview Icon" width={80} height={80} />
              </div>
            )}

            {/* File upload input and buttons to change the icon or close the popup */}
            <input type="file" accept="image/*" className={Styles.inputField} onChange={handleIconChange} />
            <button className={`${Styles.saveBtn} ${Styles.popupText}`} onClick={submitIcon}>
              Save Icon
            </button>
            <button className={`${Styles.closeBtn} ${Styles.popupText}`} onClick={toggleIconPopup}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- BANNER POPUP --- */}
      {bannerOpen && (
        <div className={Styles.popupOverlay} onClick={toggleBannerPopup}>
          <div className={Styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={Styles.popupText}>Change Community Banner</h2>

            {/* Preview the uploaded image */}
            {bannerPreview && (
              <div style={{ marginBottom: "1rem" }}>
                <Image src={bannerPreview} alt="Preview Banner" width={800} height={200} />
              </div>
            )}

            {/* File upload input and buttons to change the banner or close the popup */}
            <input type="file" accept="image/*" className={Styles.inputField} onChange={handleBannerChange} />
            <button className={`${Styles.saveBtn} ${Styles.popupText}`} onClick={submitBanner}>
              Save Banner
            </button>
            <button className={`${Styles.closeBtn} ${Styles.popupText}`} onClick={toggleBannerPopup}>
              Close
            </button>
          </div>
        </div>
      )}
      {/* --- MOD OPTIONS POPUP --- */}
      {modOptionsOpen && (
        <div className={Styles.popupOverlay} onClick={toggleModOptionsPopup}>
          <div className={Styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={Styles.popupText}>Mod Options</h2>
            {/* Add mod options content here */}
            <button className={`${Styles.popupText} ${Styles.closeBtn}`} onClick={handleKickUser}>
              Kick User
            </button>
            <button className={`${Styles.popupText} ${Styles.closeBtn}`} onClick={handleBanUser}>
              Ban User
            </button>
            {error && <p style={{ color: "yellow" }}>{error}</p>}
          </div>
        </div>
      )}
      {/* --- BLACKLIST POPUP --- */}
      {blacklistOpen && (
        <div className={Styles.popupOverlay} onClick={toggleBlacklistPopup}>
          <div className={Styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={Styles.popupText}>Blacklist</h2>
            {/* Displays each user's name in the blacklist; if empty show a message */}
            <ul>
              {community.blacklist.length === 0 ? (
                <p>The blacklist is empty.</p>
              ) : (
                community.blacklist.map((bannedUser) => (
                  <li key={bannedUser.id} className={Styles.popupText}>
                    {/* User's profile picture */}
                    <Image src={bannedUser.photoURL} alt={bannedUser.username} width={40} height={40} />
                    {/* Link to their profile */}
                    <Link href={`/profile/${bannedUser.id}`}>
                      {bannedUser.username}
                    </Link>
                    {/* Button to unban the user */}
                    <button className={`${Styles.popupText} ${Styles.saveBtn}`} onClick={() => {
                      handleUnbanUser(bannedUser.id);
                    }}>
                      Unban User
                    </button>
                  </li>
                ))
              )}
            </ul>
            {error && <p style={{ color: "yellow" }}>{error}</p>}
            <button className={`${Styles.popupText} ${Styles.closeBtn}`} onClick={toggleBlacklistPopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}