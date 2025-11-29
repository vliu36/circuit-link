"use client";

import { Community } from "../../_types/types"; // adjust path
import { Forum } from "../../_types/types";
import Link from "next/link";
import { useState } from "react";
import styles from "./serverBar.module.css";

interface ServerBarProps {
  community: Community;
  commName: string;
  forumSlug: string;
  isOwner: boolean;
  isMod: boolean;

  onCreateGroup: (groupName: string) => Promise<void> | void;
  onCreateForum: (groupId: string, forumName: string) => Promise<void> | void;

  onDeleteGroup: (groupId: string, groupName: string) => void;
  onDeleteForum: (forumId: string, forumName: string) => void;

  onOpenEditGroup: (groupId: string) => void;
}

export default function ServerBar(props: ServerBarProps) {
  const {
    community,
    commName,
    forumSlug,
    isOwner,
    isMod,
    onCreateGroup,
    onCreateForum,
    onDeleteGroup,
    onDeleteForum,
    onOpenEditGroup,
  } = props;
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createForumOpen, setCreateForumOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");

  const toggleGroupPopup = () => setCreateGroupOpen(!createGroupOpen);
  const toggleForumPopup = () => setCreateForumOpen(!createForumOpen);

  return (
    <div className={styles.serverBar} style={{ gridArea: "ServerBar" }}>
      {/* ---- HEADER ---- */}
      <div style={{ display: "flex" }}>
        <h1 className={styles.commName}>{commName}</h1>

        {(isOwner || isMod) && (
          <button className={styles.plusButton} onClick={toggleGroupPopup}>
            +
          </button>
        )}
      </div>

      <div className={styles.horizontalLine}></div>

      {/* ---- GROUPS AND FORUMS ---- */}
      <div className={styles.serverContainer}>
        {community.groupsInCommunity.length === 0 && (
          <p>No groups in this community yet.</p>
        )}

        {community.groupsInCommunity.map((group) => (
          <div key={group.id} style={{ marginBottom: "2rem" }}>
            {/* ---- GROUP HEADER ---- */}
            <div className={styles.groupHeader}>
              <div className={styles.groupName}>{group.name}</div>

              {(isOwner || isMod) && (
                <>
                  <button
                    className={styles.plusButton}
                    onClick={() => {
                      setGroupId(group.id);
                      setGroupName(group.name);
                      toggleForumPopup();
                    }}
                  >
                    +
                  </button>

                  <button
                    className={styles.deleteGroup}
                    onClick={() => onDeleteGroup(group.id, group.name)}
                  >
                    Delete
                  </button>

                  <button
                    className={styles.editGroup}
                    onClick={() => onOpenEditGroup(group.id)}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>

            {/* ---- FORUMS IN THIS GROUP ---- */}
            {group.forumsInGroup.length > 0 ? (
              <>
                {group.forumsInGroup.map((forum) => (
                  <div
                    key={forum.id}
                    className={`${styles.channelHeader} ${
                      forum.slug === forumSlug ? styles.activeChannel : ""
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
                        Delete Forum
                      </button>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <p>No forums in this group.</p>
            )}
          </div>
        ))}
      </div>

      {/* ---- CREATE GROUP POPUP ---- */}
      {createGroupOpen && (
        <div className={styles.popupOverlay} onClick={toggleGroupPopup}>
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.popupText}>Create Group</h2>

            <input
              type="text"
              className={`${styles.popupText} ${styles.inputField}`}
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <button
              className={`${styles.saveBtn} ${styles.popupText}`}
              onClick={async () => {
                await onCreateGroup(groupName);
                toggleGroupPopup();
              }}
            >
              Create
            </button>

            <button
              className={`${styles.closeBtn} ${styles.popupText}`}
              onClick={toggleGroupPopup}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---- CREATE FORUM POPUP ---- */}
      {createForumOpen && (
        <div className={styles.popupOverlay} onClick={toggleForumPopup}>
          <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.popupText}>Create Forum</h2>

            <input
              type="text"
              className={`${styles.popupText} ${styles.inputField}`}
              placeholder="Forum Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <button
              className={`${styles.saveBtn} ${styles.popupText}`}
              onClick={async () => {
                await onCreateForum(groupId, groupName);
                toggleForumPopup();
              }}
            >
              Create
            </button>

            <button
              className={`${styles.closeBtn} ${styles.popupText}`}
              onClick={toggleForumPopup}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}