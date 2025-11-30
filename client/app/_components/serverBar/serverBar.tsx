// This page displays the main community page with groups and forums.
"use client"

import React, { useState, useEffect } from "react";
import styles from "./serverBar.module.css";
import { useAuth } from "../../_firebase/context.tsx";
import Link from "next/link";
import Image from "next/image";
import * as commApi from "./community";
import { Community } from "../../_types/types.ts";
import { useRouter } from "next/navigation";
import { getCommunities } from "../../landing.ts";
import { DocumentData } from "@firebase/firestore";
import { usePathname } from "next/navigation";


import trashBin from "../../../public/trash-solid-full.svg";
import editButton from "../../../public/pencil-solid-full.svg";

export default function ServerBar({
  params,
}: {
  params: { commName: string };
}) {
  const { commName } = params;
  const { user, userData } = useAuth();

  const pathname = usePathname();
  const activeForumSlug = pathname.split("/")[3] || "";

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userCommunities, setUserCommunities] = useState<DocumentData[]>([]);

  // Group + forum data
  const [groupName, setGroupName] = useState("");
  const [forumInputs, setForumInputs] = useState<{
    [groupId: string]: { name: string; description: string; message: string };
  }>({});

  const [targetUserId, setTargetUserId] = useState("");

  // Popup states
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createForumOpen, setCreateForumOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [confirmDeleteForum, setConfirmDeleteForum] = useState(false);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);

  // Which group are we editing / creating forums in?
  const [activeGroupId, setActiveGroupId] = useState("");
  const [activeGroupName, setActiveGroupName] = useState("");

  // Which forum are we editing?
  const [activeForumId, setActiveForumId] = useState("");
  const [activeForumName, setActiveForumName] = useState("");

  const router = useRouter();

  // Load user communities
  useEffect(() => {
    async function load() {
      if (!userData?.communities) return;

      try {
        const joined = await getCommunities(userData.communities);
        setUserCommunities(joined);
      } catch (err) {
        console.error("Error loading user communities:", err);
      }
    }
    load();
  }, [userData]);

  // Load community structure
  useEffect(() => {
    setLoading(true);
    commApi
      .fetchStructure(commName)
      .then((data) => {
        if (data) setCommunity(data);
      })
      .finally(() => setLoading(false));
  }, [commName]);

  // Store the current forum being viewed
  const [forum, setForum] = useState<{
    id: string;
    name: string;
    slug: string;
    parentGroup: string;
  } | null>(null);

  useEffect(() => {
    async function loadForum() {
      if (!commName || !activeForumSlug) {
        setForum(null);
        return;
      }
      try {
        console.log("Loading forum data for slug:", activeForumSlug);
        const forumData = await commApi.getForumDocBySlug(commName, activeForumSlug);
        if (forumData) {
          setForum({
            id: forumData.id,
            name: forumData.name,
            slug: forumData.slug,
            parentGroup: forumData.parentGroup,
          });
        } else {
          setForum(null);
        }
      } catch (err) {
        console.error("Error loading forum data:", err);
        setForum(null);
      }
    }
    loadForum();
  }, [commName, activeForumSlug]);

  if (loading) return <div>Loading channels...</div>;
  if (!community) return <div>channels not found.</div>;

  const isMember = community.userList.some((u) => u.id === user?.uid);
  const isMod = community.modList.some((m) => m.id === user?.uid);
  const isOwner = community.ownerList.some((o) => o.id === user?.uid);
  const isBanned = community.blacklist.some((b) => b.id === user?.uid);

  if (isBanned) return <div>You are banned from this community.</div>;
  if (!community.public && !isMember) return <div>This community is private.</div>;

  const toggleGroupPopup = () => {
    setCreateGroupOpen(!createGroupOpen);
    setError(null);
  };

  const toggleForumPopup = () => {
    setCreateForumOpen(!createForumOpen);
    setError(null);
  };

  const toggleConfirmDeleteGroup = () => {
    setConfirmDeleteGroup(!confirmDeleteGroup);
    setError(null);
  };

  const toggleConfirmDeleteForum = () => {
    setConfirmDeleteForum(!confirmDeleteForum);
    setError(null);
  };

  const toggleEditGroupPopup = () => {
    setEditGroupOpen(!editGroupOpen);
    setError(null);
  };

  const refreshCommunity = async () => {
    try {
      const updated = await commApi.fetchStructure(commName);
      if (updated) setCommunity(updated);
    } catch (err) {
      console.error("Error refreshing community:", err);
    }
  };

  // CREATE GROUP
  const onCreateGroup = async (name: string) => {
    if (!user) return;
    const res = await commApi.createGroup(commName, name);
    setGroupName("");
    toggleGroupPopup();
    await refreshCommunity();
  };

  // DELETE GROUP POPUP
  const onDeleteGroup = (groupId: string, groupName: string) => {
    // if (!confirm(`Delete group "${groupName}"?`)) return;
    setActiveGroupName(groupName);
    setActiveGroupId(groupId);
    toggleConfirmDeleteGroup();
    // handleDeleteGroup(groupId);
  };

  const handleDeleteGroup = async (groupId: string) => {
      if (!user) return;
      try {
          // Check if user is currently viewing a forum within the group being deleted
          let reroute = false;
          if (forum && forum.parentGroup === groupId) {
              reroute = true;
          }

          const result = await commApi.deleteGroup(groupId, commName);
          if (!result || result.status === "error") {
              setError(result?.message || "Failed to delete group.");
              return;
          }
          console.log("Group deleted successfully");
          // Reroute user to community main page after deleting the group, or refresh community structure
          if (reroute) {
              router.push(`/community/${commName}`);
          } else {
              await refreshCommunity();
              toggleConfirmDeleteGroup();
          }
      } catch (err) {
          console.error("Error deleting group:", err);
      } 
  };


  // OPEN EDIT GROUP
  const onOpenEditGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setGroupName(groupName); // NEW
    toggleEditGroupPopup();
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

  // CREATE FORUM POPUP INIT
  const onCreateForumInit = (groupId: string) => {
    setActiveGroupId(groupId);
    setForumInputs((prev) => ({
      ...prev,
      [groupId]: { name: "", description: "", message: "" },
    }));
    toggleForumPopup();
  };

  // CREATE FORUM
  const onCreateForum = async (groupId: string) => {
    if (!user) return;

    const { name, description } = forumInputs[groupId] || {
      name: "",
      description: "",
    };

    if (!name || !description) {
      setForumInputs((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          message: "Name and description required",
        },
      }));
      return;
    }

    // Verify name length
    if (name.length < 1 || name.length > 24) {
      setForumInputs((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          message: "Name must be between 1 and 24 characters",
        },
      }));
      return;
    }
    // Verify name characters
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(name)) {
      setForumInputs((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          message: "Name can only contain letters, numbers, underscores, and hyphens",
        },
      }));
      return;
    }
    

    const slug = await commApi.createForum({
      name,
      description,
      groupId,
      commName,
    });

    toggleForumPopup();
    router.push(`/community/${commName}/${slug}`);
  };

  // DELETE FORUM
  const onDeleteForum = (forumId: string, forumName: string) => {
    setActiveForumName(forumName);
    setActiveForumId(forumId);
    toggleConfirmDeleteForum();
  };

  // --- DELETE FORUM ---
  const handleDeleteForum = async (forumId: string) => {
      if (!user) return;
      try {
          // Check if user is currently viewing the forum being deleted
          let reroute = false;
          console.log("Current forum id:", forum?.id);
          console.log("Target forum id:", forumId);
          if (forum?.id === forumId) {
              reroute = true;
          }
          const result = await commApi.deleteForum(forumId, commName);
          if (!result || result.status === "error") {
              setError(result?.message || "Failed to delete forum.");
              return;
          }
          console.log("Forum deleted successfully");

          // Reroute user to community main page after deleting the forum, or refresh community structure
          if (reroute) {
              router.push(`/community/${commName}`);
          } else {
              await refreshCommunity();
              toggleConfirmDeleteForum();
          }
      } catch (err) {
          console.warn("Error deleting forum:", err);
          setError("Error deleting forum: " + (err instanceof Error ? err.message : ""));
      }
  };

  return (
    <div className={styles.serverBar} style={{ gridArea: "ServerBar" }}>
      <div style={{ display: "flex" }}>
        <h1 className={styles.commName}>{commName}</h1>

        {(isOwner || isMod) && (
          <button className={styles.plusButton} onClick={toggleGroupPopup}>
            +
          </button>
        )}
      </div>

      <div className={styles.horizontalLine}></div>

      <div className={styles.serverContainer}>
        {community.groupsInCommunity.length === 0 && (
          <p>No groups in this community yet.</p>
        )}

        {community.groupsInCommunity.map((group) => (
          <div key={group.id} style={{ marginBottom: "2rem" }}>
            <div className={styles.groupHeader}>
              <div className={styles.groupName}>{group.name}</div>

              {(isOwner || isMod) && (
                <>
                  <button
                    className={styles.plusButton}
                    onClick={() => onCreateForumInit(group.id)}
                  >
                    +
                  </button>

                  <button
                    className={styles.deleteGroup}
                    onClick={() => onDeleteGroup(group.id, group.name)}
                  >
                    <Image src={trashBin} width={18} height={18} alt="delete" />
                  </button>

                  <button
                    className={styles.editGroup}
                    onClick={() => onOpenEditGroup(group.id)}
                  >
                    <Image src={editButton} width={18} height={18} alt="edit" />
                  </button>
                </>
              )}
            </div>

            {group.forumsInGroup.length > 0 ? (
              group.forumsInGroup.map((forum) => (
                <div
                  key={forum.id}
                  className={`${styles.channelHeader} ${activeForumSlug === forum.slug ? styles.activeForum : ""
                    }`}
                >                  
                <Link
                  className={styles.channelName}
                  href={`/community/${commName}/${forum.slug}`}
                >
                    &gt; {forum.name}
                  </Link>

                  {(isOwner || isMod) && (
                    <button
                      className={styles.deleteChannel}
                      onClick={() => onDeleteForum(forum.id, forum.name)}
                    >
                      <Image
                        src={trashBin}
                        width={18}
                        height={18}
                        alt="delete"
                      />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p>No forums in this group.</p>
            )}
          </div>
        ))}
      </div>

      {/* CREATE GROUP POPUP */}
      {createGroupOpen && (
        <div className={styles.popupOverlay} onClick={toggleGroupPopup}>
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2>Create Group</h2>

            <input
              type="text"
              className={styles.inputField}
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <button className={styles.saveBtn} onClick={() => onCreateGroup(groupName)}>
              Create
            </button>

            <button className={styles.closeBtn} onClick={toggleGroupPopup}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* CREATE FORUM POPUP */}
      {createForumOpen && (
        <div className={styles.popupOverlay} onClick={toggleForumPopup}>
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2>Create Forum</h2>

            <input
              type="text"
              maxLength={24}
              minLength={1}
              className={styles.inputField}
              placeholder="Forum Name"
              value={forumInputs[activeGroupId]?.name || ""}
              onChange={(e) =>
                setForumInputs((prev) => ({
                  ...prev,
                  [activeGroupId]: {
                    ...prev[activeGroupId],
                    name: e.target.value,
                  },
                }))
              }
            />

            <input
              type="text"
              maxLength={200}
              className={styles.inputField}
              placeholder="Forum Description"
              value={forumInputs[activeGroupId]?.description || ""}
              onChange={(e) =>
                setForumInputs((prev) => ({
                  ...prev,
                  [activeGroupId]: {
                    ...prev[activeGroupId],
                    description: e.target.value,
                  },
                }))
              }
            />
            {forumInputs[activeGroupId]?.message && (
              <p className={styles.errorText}>
                {forumInputs[activeGroupId]?.message}
              </p>
            )}
            <button
              className={styles.saveBtn}
              onClick={() => onCreateForum(activeGroupId)}
            >
              Create
            </button>

            <button className={styles.closeBtn} onClick={toggleForumPopup}>
              Close
            </button>
          </div>
        </div>
      )}
      {confirmDeleteForum && (
          <div className={styles.popupOverlay} onClick={toggleConfirmDeleteForum}>
              <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                  <h2 className={styles.popupText}>Confirm Delete Forum</h2>
                  <p className={styles.popupText}>Are you sure you want to delete forum &quot;{activeForumName}&quot;? <br /> This action cannot be undone.</p>
                  {error && <p className={styles.errorText}>{error}</p>}
                  <button onClick={toggleConfirmDeleteForum} className={styles.cancelButton}>Cancel</button>
                  <button onClick={() => {handleDeleteForum(activeForumId)}} className={styles.deleteButtonPopup}>Delete</button>
              </div>
          </div>
      )}
      {confirmDeleteGroup && (
          <div className={styles.popupOverlay} onClick={toggleConfirmDeleteGroup}>
              <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                  <h2 className={styles.popupText}>Confirm Delete Group</h2>
                  <p className={styles.popupText}>Are you sure you want to delete group &quot;{activeGroupName}&quot;? <br /> This will delete all of its forums and cannot be undone.</p>
                  {error && <p className={styles.errorText}>{error}</p>}
                  <button onClick={toggleConfirmDeleteGroup} className={styles.cancelButton}>Cancel</button>
                  <button onClick={() => {handleDeleteGroup(activeGroupId)}} className={styles.deleteButtonPopup}>Delete</button>
              </div>
          </div>
      )}
            {/* --- EDIT GROUP POPUP --- */}
      {editGroupOpen && (
        <div className={styles.popupOverlay} onClick={toggleEditGroupPopup}>
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.popupText}>Edit Group</h2>

            {/* Form for editing the group */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newName = formData.get("newName") as string;
              const groupId = activeGroupId;

              await handleEditGroup(groupId, newName);
            }}>
              <label className={styles.popupText}>
                New Name: <br />
                <input
                  type="text"
                  name="newName"
                  className={`${styles.popupText} ${styles.inputField}`}
                  style={{ border: "2px solid darkgrey" }}
                  maxLength={24}
                  pattern="^[a-zA-Z0-9_-]+$"
                  title="24 characters max. Name can only contain letters, numbers, underscores, and hyphens."
                  required
                />
              </label>
              <br /><br />
              {error && <p className={styles.errorText}>{error}</p>}
              <br />
              <button type="submit" className={`${styles.popupText} ${styles.saveBtn}`}>Save Changes</button>
            </form>
            <button className={` ${styles.closeBtn} ${styles.popupText}`} onClick={toggleEditGroupPopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}