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

  // Which group are we editing / creating forums in?
  const [activeGroupId, setActiveGroupId] = useState("");

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
    if (!confirm(`Delete group "${groupName}"?`)) return;
    handleDeleteGroup(groupId);
  };

  const handleDeleteGroup = async (groupId: string) => {
    await commApi.deleteGroup(groupId, commName);
    await refreshCommunity();
  };

  // OPEN EDIT GROUP
  const onOpenEditGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setGroupName(groupName); // NEW
    setEditGroupOpen(true);
  };

  // EDIT GROUP
  const handleEditGroup = async (newName: string) => {
    await commApi.editGroup(commName, activeGroupId, newName);
    setEditGroupOpen(false);
    await refreshCommunity();
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
    if (!confirm(`Delete forum "${forumName}"?`)) return;
    handleDeleteForum(forumId);
  };

  const handleDeleteForum = async (forumId: string) => {
    await commApi.deleteForum(forumId, commName);
    await refreshCommunity();
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
    </div>
  );
}