// This page is for displaying individual post details along with its replies in a community forum.
"use client";
import { Community } from "../../../../_types/types.ts";
import { useAuth } from "../../../../_firebase/context.tsx";
import { Post, Reply, useReplies } from "./post.ts";
import { use, useEffect, useState } from "react";
import styles from "./postPage.module.css";
import NavBar from '../../../../_components/navbar/navbar.tsx';
import { fetchStructure, createGroup, deleteGroup, createForum, deleteForum } from "../../../[commName]/community.ts";
import Link from 'next/link';
import thumbsUp from '../../../../../public/thumbs-up-regular-full.svg';
import thumbsUpGlow from '../../../../../public/thumbs-up-glow-full.svg';
import thumbsDown from '../../../../../public/thumbs-down-regular-full.svg';
import thumbsDownGlow from '../../../../../public/thumbs-down-glow-full.svg';
import Image from 'next/image'
import { useRouter } from "next/navigation";
import * as commApi from "../../community";
import { fetchTopCommunities, fetchTopUsers, getCommunities } from "@/app/landing.ts";
import { DocumentData } from "firebase/firestore";

export default function PostDetail({ params }: { params: Promise<{ commName: string; forumSlug: string; postId: string }> }) {
    const { userData } = useAuth();
    const { commName, forumSlug, postId } = use(params);
    const { user, loading: authLoading } = useAuth();
    const postIdStr = Array.isArray(postId) ? postId[0] : postId;
    const { post, handleVote, addReply, deleteReplyById, editReply, deletePostById, editPost, fetchPost, loading } = useReplies(postIdStr || "", user?.uid);
    const [community, setCommunity] = useState<Community | null>(null);
    const [activeReplyTo, setActiveReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [load, setLoading] = useState(true);
    const [showCreateForum, setShowCreateForum] = useState<{ [key: string]: boolean }>({});
    const [editGroupOpen, setEditGroupOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editGroupId, setEditGroupId] = useState<string>("");
    const [forumInputs, setForumInputs] = useState<{ [groupId: string]: { name: string; description: string; message: string } }>({});
    const [userCommunities, setUserCommunities] = useState<DocumentData[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
    const [deleteGroupId, setDeleteGroupId] = useState("");
    const [deleteGroupName, setDeleteGroupName] = useState("");
    const [confirmDeleteForum, setConfirmDeleteForum] = useState(false);
    const [deleteForumId, setDeleteForumId] = useState("");
    const [deleteForumName, setDeleteForumName] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [groupName, setGroupName] = useState("");
    const router = useRouter();
    const [groupMessage, setGroupMessage] = useState("");
    const MAX_DEPTH = 6;


    const [createGroupOpen, setCreateGroupOpen] = useState(false);

    // --- Delete Post State Variables ---
    const [deletePostOpen, setDeletePostOpen] = useState(false);
    const [deletePostId, setDeletePostId] = useState<string>("");
    const [isReplyDelete, setIsReplyDelete] = useState(false);


    const toggleCreateGroupPopup = () => {
        setCreateGroupOpen(!createGroupOpen);
        setError(null);
    };

    const toggleDeletePostPopup = () => {
        setDeletePostOpen(!deletePostOpen);
        setError(null);
    };

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

    useEffect(() => {
        if (loading) return;

        async function loadData() {
            const comms = await fetchTopCommunities();
            const users = await fetchTopUsers();

            if (userData?.communities) {
                try {
                    const joined = await getCommunities(userData.communities);
                    setUserCommunities(joined);
                } catch (err) {
                    console.error("Error loading user's communities:", err);
                }
            }

            setDataLoading(false);
        }

        loadData();
    }, [userData, loading]);

    const handleDeleteForum = async (forumId: string) => {
        if (!user) return;
        try {
            // Check if user is currently viewing the forum being deleted
            let reroute = false;
            if (forumId === post?.parentForum) {
                reroute = true;
            }
            const result = await commApi.deleteForum(forumId, commName);
            console.log("Forum deleted successfully:", result);
            // Reroute user to community main page after deleting the forum, or refresh community structure
            if (reroute) {
                router.push(`/community/${commName}`);
            } else {
                await refreshCommunity();
            }
        } catch (err) {
            console.error("Error deleting forum:", err);
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

    useEffect(() => {
        setLoading(true);
        fetchStructure(commName)
            .then((data) => {
                if (data) setCommunity(data);
            })
            .finally(() => setLoading(false));
    }, [commName]);

    const handleCreateForumBox = async (groupId: string) => {
        setShowCreateForum({});
    };

    // TODO ---------------- Use this in notifications when reporting a reply
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const element = document.querySelector(hash);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
    }, [post]);

    if (load) return <div>Loading community...</div>;
    if (!community) return <div>Community not found.</div>;

    // Handler for editing posts/replies
    const handleEdit = async (id: string, isReply: boolean) => {
        if (!editContent.trim()) return alert("Content cannot be empty.");
        try {
            if (isReply) {
                await editReply(id, editContent);
            } else if (post) {
                await editPost(post.id, user?.uid, editTitle, editContent);
            }
            setEditingId(null);
            setEditContent("");
            setEditTitle("");
            fetchPost();
        } catch (err) {
            console.error("Failed to edit:", err);
        }
    };

    // ------ Toggle popups ------

    const toggleEditGroupPopup = () => {
        setEditGroupOpen(!editGroupOpen);
        setError(null);
    };

    const toggleConfirmDeleteForum = () => {
        setConfirmDeleteForum(!confirmDeleteForum);
        setMessage(null);
    };

    const toggleConfirmDeleteGroup = () => {
        setConfirmDeleteGroup(!confirmDeleteGroup);
        setMessage(null);
    };



    // Handler for deleting posts/replies
    const handleDelete = async (id: string, isReply: boolean) => {
        // if (!confirm("Are you sure you want to delete this?")) return;
        try {
            if (isReply) {
                await deleteReplyById(id, commName);
                fetchPost();
            } else if (post) {
                await deletePostById(id, commName);
                window.location.href = `/community/${commName}/${forumSlug}`;
            }
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    // --- DELETE GROUP ---
    const handleDeleteGroup = async (groupId: string) => {
        if (!user) return;
        try {
            // Check if user is currently viewing a post in the group being deleted
            let reroute = false;
            if (groupId === post?.parentGroup) {
                reroute = true;
            }
            const result = await commApi.deleteGroup(groupId, commName);
            console.log("Group deleted successfully:", result);
            // Reroute user to community main page after deleting the group, or refresh community structure
            if (reroute) {
                router.push(`/community/${commName}`);
            } else {
                await refreshCommunity();
            }
        } catch (err) {
            console.error("Error deleting group:", err);
        }
    };

    const isMember = community.userList.some(m => m.id === user?.uid);
    const isMod = community.modList.some(m => m.id === user?.uid);
    const isOwner = community.ownerList.some(o => o.id === user?.uid);
    const isBanned = community.blacklist.some(b => b.id === user?.uid);
    if (isBanned) {
        return <div>You are banned from this community.</div>;
    }

    if (!community.public && !isMember) {
        return (<div>This community is private.</div>);
        // TODO : Add request to join functionality
    }

    // Recursive rendering function for posts and replies
    const renderPostOrReply = (item: Post | Reply, depth = 0) => {
        if (depth >= MAX_DEPTH) return null;
        const isReply = "timeReply" in item;
        const isAuthor = item.authorId === user?.uid;

        return (
            <div
                key={item.id}
                id={`reply-${item.id}`}
                className={styles.replyCard}>
                {/* If editing, show input fields instead */}
                {editingId === item.id ? (
                    <div>
                        {/* Show title input if not editing a reply */}
                        {!isReply &&
                            <input
                                className={styles.replyInput}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Edit title"
                            />
                        }

                        {/* Show content input */}
                        <textarea
                            className={styles.replyInput}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Edit contents"
                        />
                        {/* ---- Buttons ---- */}
                        <div className={styles.actions}>
                            {/* Save button */}
                            <button
                                className={styles.editButton}
                                onClick={() => handleEdit(item.id, isReply)}
                            >
                                Save
                            </button>
                            {/* Cancel button */}
                            <button
                                className={styles.deleteButton}
                                onClick={() => { setEditingId(null); setEditContent(""); setEditTitle(""); }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.postBox}>
                        {/* Otherwise, show the post/reply */}
                        {/* Show the author's username and display total yay score */}
                        <div className={styles.meta}>
                            <div className={styles.userIcon}>
                                <Image src={item.authorPFP} alt={"Profile picture"} width={64} height={64} className={styles.userIcon} />
                            </div>
                            <div className={styles.userTextAlignPosts}>
                                <Link href={`/profile/${item.authorId}`}>
                                    {item.authorUsername}
                                </Link>
                            </div>
                        </div>

                        {/* Show the time created, using timeReply if a reply, or timePosted if a post. Additionally show if edited */}
                        <p className={styles.time}>{isReply ? item.timeReply : item.timePosted}{item.edited && <span> (edited)</span>}</p>

                        {/* If the item has a title (only posts have this) shows title */}
                        {"title" in item && <h2 className={styles.title}>{item.title}</h2>}
                        {/* If the item has media (only posts have this) display media */}
                        {"media" in item && item.media && (
                            // If media ends with .mp4, render video tag, else render image tag
                            item.media.endsWith(".mp4") ? (
                                <div className={styles.mediaContainer}>
                                    <video controls className={styles.postMedia}>
                                        <source src={item.media} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            ) : (
                                <div className={styles.mediaContainer}>
                                    <Image src={item.media} alt="Post media" width={200} height={200} className={styles.postMedia} />
                                </div>
                            )
                        )}
                        {/* Show content of post or reply */}
                        <p className={styles.contents}>{item.contents}</p>
                        {/* Show metadata */}

                        <div className={styles.buttonFormat}>
                            <div className={styles.actions}>
                                {/* Yay button; if the current user is in the yay list, show as active (green) */}
                                <button
                                    className={`${styles.voteButton} ${user?.uid && item.yayList.includes(user.uid) ? styles.yayActive : ""}`}
                                    onClick={() => handleVote(item.id, "yay", isReply)}
                                >
                                    <div className={styles.votingIcon}>
                                        <Image
                                            src={user?.uid && item.yayList.includes(user.uid) ? thumbsUpGlow : thumbsUp}
                                            width={40}
                                            height={40}
                                            alt="YAYS"
                                        />
                                    </div>

                                </button>
                                <div className={styles.yayscore}>{item.yayScore}</div>
                                {/* Nay button; if the current user is in the nay list, show as active (red) */}
                                <button
                                    className={`${styles.voteButton} ${styles.dislikeButton} ${user?.uid && item.nayList.includes(user.uid) ? styles.nayActive : ""}`}
                                    onClick={() => handleVote(item.id, "nay", isReply)}
                                >
                                    <Image
                                        src={user?.uid && item.nayList.includes(user.uid) ? thumbsDownGlow : thumbsDown}
                                        width={40}
                                        height={40}
                                        alt="YAYS"
                                    />
                                </button>
                                {/* Reply button; disabled (but not hidden) if max depth reached */}

                            </div>

                            {/* Edit and Delete buttons for posts and replies, only shown if the current user is the author */}
                            {(isOwner || isMod || isAuthor) && (
                                <div className={styles.utilityButtons}>
                                    {/* Edit button */}
                                    <button
                                        className={styles.editButton}
                                        onClick={() => { setEditingId(item.id); setEditContent(item.contents); if (!isReply) setEditTitle(item.title); }}
                                    >
                                        Edit
                                    </button>
                                    {/* Delete button */}
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => {
                                            setDeletePostId(item.id);
                                            setIsReplyDelete(isReply);
                                            toggleDeletePostPopup();
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}

                        </div>
                        <div>
                            {(depth < MAX_DEPTH - 1) && (
                            <button
                                className={styles.replyButton}
                                onClick={() => setActiveReplyTo(activeReplyTo === item.id ? null : item.id)}
                                disabled={depth >= MAX_DEPTH - 1}
                            >
                                Reply to this post
                            </button>
                            )}
                        </div>
                        {/* If the current item is being replied to */}
                        {activeReplyTo === item.id && (
                            <div className={styles.replyBox} >
                                {/* Show text area for reply */}
                                <textarea
                                    className={styles.replyInput}
                                    placeholder="Write a reply..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                />
                                {/* Submit button */}
                                <button
                                    className={styles.submitButton}
                                    onClick={() => { addReply(item.id, replyContent, isReply); setReplyContent(""); setActiveReplyTo(null); }}
                                >
                                    Submit
                                </button>
                            </div>
                        )}
                    </div>


                )}





                <div style={{ marginBottom: "2vw" }}></div>

                {/* Render nested replies, if any */}
                {"listOfReplies" in item && item.listOfReplies.length > 0 && (
                    <div style={{ marginLeft: "2vw", width: "96%" }}>
                        {item.listOfReplies.map((r) => renderPostOrReply(r, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (!user) return <div>Sign in to view replies!</div>;
    if (authLoading || !post) return <div>Loading post...</div>;

    return (
        <main>
            <div className={styles.background}>
                <div className={styles.yourCommunitiesBar} style={{ gridArea: "CommunitiesBar" }}>
                    <h1>Your Communities</h1>

                    <div>
                        {userCommunities.length === 0 ? (
                            <p>No joined communities.</p>
                        ) : (
                            userCommunities.map((c: DocumentData, i: number) => (
                                <Link
                                    key={c.id}
                                    className={styles.communitiesButtons}
                                    href={`/community/${c.name}`}
                                >
                                    <Image
                                        src={c.icon ?? "/defaultCommunity.svg"}
                                        alt={c.name}
                                        width={30}
                                        height={30}
                                        className={styles.addIcon}
                                    />
                                    <h1 className={styles.buttonTextforCommunities}>{c.name}</h1>
                                </Link>
                            ))
                        )}
                    </div>

                    <Link className={styles.communitiesButtons} href={`/community`}>
                        <Image src="/plus.svg" className={styles.addIcon} alt="Add icon" width={16} height={16} />
                        <h1 className={styles.buttonTextforCommunities}>Add a Community</h1>
                    </Link>
                </div>


                <div className={styles.serverBar} style={{ gridArea: "ServerBar" }}>
                    <div style={{ display: "flex" }}>
                        <h1 className={styles.commName}>{commName}</h1>
                        <div className={styles.createGroupBtn}>
                            {(isOwner || isMod) && (
                                <button
                                    onClick={toggleCreateGroupPopup}
                                >
                                    +
                                </button>
                            )}
                            {createGroupOpen && (
                                <div className={styles.popupOverlay} onClick={toggleCreateGroupPopup}>
                                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                                        <h2 className={styles.popupText}>Create Group</h2>

                                        <input
                                            type="text"
                                            className={`${styles.popupText} ${styles.inputField}`}
                                            placeholder="Group Name"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                        />

                                        {groupMessage && (
                                            <p className={styles.popupText}>{groupMessage}</p>
                                        )}

                                        <button
                                            className={`${styles.saveBtn} ${styles.popupText}`}
                                            onClick={async () => {
                                                await handleCreateGroup();
                                                if (!error) toggleCreateGroupPopup();
                                            }}
                                        >
                                            Create
                                        </button>

                                        <button
                                            className={`${styles.closeBtn} ${styles.popupText}`}
                                            onClick={toggleCreateGroupPopup}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.horizontalLine}></div>
                    <div className={styles.serverContainer}>
                        {/* --- GROUPS AND FORUMS --- */}
                        <section>
                            {community.groupsInCommunity.length === 0 && <p>No groups in this community yet.</p>}

                            {/* Displays a group and its forums */}
                            {community.groupsInCommunity.map((group) => (
                                <div key={group.id} style={{ marginBottom: "2rem" }}>
                                    <div className={styles.groupHeader}>
                                        <div className={styles.groupName}>{group.name}</div>
                                        {/* Only displays if user is an owner or a mod */}
                                        {(isOwner || isMod) && (
                                            <button
                                                className={styles.plusButton}
                                                onClick={() =>
                                                    setShowCreateForum(() => ({
                                                        // close ALL popups, only toggle the one clicked
                                                        [group.id]: !showCreateForum[group.id]
                                                    }))
                                                }
                                            >
                                                +
                                            </button>
                                        )}
                                        {/* --- CREATE FORUM FORM (only shown if toggled on) --- */}
                                        {showCreateForum[group.id] && (
                                            <div className={styles.createForumContainer} style={{ marginTop: "1rem" }}>
                                                <h4 className={styles.createForumText}>Create a new forum in {group.name}</h4>

                                                {/* -------- Forum Name -------- */}
                                                <input
                                                    type="text"
                                                    placeholder="Forum name"
                                                    className={styles.forumCreationInfomation}
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
                                                    className={styles.forumDescCreationInfomation}
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
                                                    className={styles.createForumButton}
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
                                                <button className={styles.deleteGroup} onClick={() => { setDeleteGroupId(group.id); setDeleteGroupName(group.name); toggleConfirmDeleteGroup(); }}>
                                                    Delete
                                                </button>
                                                <button className={styles.editGroup} onClick={() => { toggleEditGroupPopup(); setEditGroupId(group.id); }}>
                                                    Edit
                                                </button>
                                            </>
                                        }
                                    </div>

                                    {/* Displays the forums in this group */}
                                    {group.forumsInGroup.length > 0 ? (
                                        <div>
                                            {group.forumsInGroup.map((forum) => (
                                                <div
                                                    key={forum.id}
                                                    className={`${styles.channelHeader} ${forum.slug === forumSlug ? styles.activeChannel : ""
                                                        }`}
                                                >
                                                    {/* Link to the forum (displays its posts) */}
                                                    <div className={styles.channelName}>
                                                        <Link href={`/community/${commName}/${forum.slug}`}>
                                                            &gt;{forum.name}
                                                        </Link>
                                                    </div>
                                                    {/* -------- Delete Forum Button -------- */}
                                                    {/* Only shows if user is owner or mod */}
                                                    {(isOwner || isMod) &&
                                                        <button className={styles.deleteChannel} onClick={() => { setDeleteForumName(forum.name); setDeleteForumId(forum.id); toggleConfirmDeleteForum(); }}>
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

                <div className={styles.RightBar} style={{ gridArea: "RightBar" }}>
                    <div className={styles.channelInfoBox} >
                        <div className={styles.channelInfoh1}>{commName}</div>
                        <div className={styles.channelInfoh2}>{community?.description}</div>

                    </div>
                    <div className={styles.horizontalLine}></div>
                    <div className={styles.RulesBar}>
                        <div className={styles.horizontalLine}></div>
                        <div className={styles.horizontalLine}></div>
                        <h1>Rules</h1>
                        {/* Display rules here */}
                        <p>{community?.rules}</p>
                    </div>
                </div>



                <div className={styles.navBox} style={{ gridArea: "NavBar" }}>
                    <NavBar />
                </div>




                <div className={styles.postsPage} style={{ gridArea: "Center" }}>
                    <div className={styles.backDisplay}>
                        <Link href={`/community/${commName}/${forumSlug}`}>
                            Back
                        </Link>
                    </div>
                    {renderPostOrReply(post)}

                </div>

            </div>
            {confirmDeleteForum && (
                <div className={styles.popupOverlay} onClick={toggleConfirmDeleteForum}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Confirm Delete Forum</h2>
                        <p className={styles.popupText}>Are you sure you want to delete forum &quot;{deleteForumName}&quot;? <br /> This action cannot be undone.</p>
                        <button onClick={toggleConfirmDeleteForum} className={styles.cancelButton}>Cancel</button>
                        <button onClick={() => { handleDeleteForum(deleteForumId); toggleConfirmDeleteForum(); }} className={styles.deleteButton}>Delete</button>
                    </div>
                </div>
            )}
            {confirmDeleteGroup && (
                <div className={styles.popupOverlay} onClick={toggleConfirmDeleteGroup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Confirm Delete Group</h2>
                        <p className={styles.popupText}>Are you sure you want to delete group &quot;{deleteGroupName}&quot;? <br /> This will delete all of its forums and cannot be undone.</p>
                        <button onClick={toggleConfirmDeleteGroup} className={styles.cancelButton}>Cancel</button>
                        <button onClick={() => { handleDeleteGroup(deleteGroupId); toggleConfirmDeleteGroup(); }} className={styles.deleteButtonCard}>Delete</button>
                    </div>
                </div>
            )}
            {/* --- Delete Post Confirmation Popup --- */}
            {deletePostOpen && (
                <div className={styles.popupOverlay} onClick={toggleDeletePostPopup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Confirm Delete</h2>
                        <p className={styles.popupText}>Are you sure you want to delete this {isReplyDelete ? "reply" : "post"}? This action cannot be undone.</p>
                        <button onClick={toggleDeletePostPopup} className={styles.cancelButton}>Cancel</button>
                        <button onClick={() => { handleDelete(deletePostId, isReplyDelete); toggleDeletePostPopup(); }} className={styles.deleteButtonCard}>Delete</button>
                    </div>
                </div>
            )}
        </main>
    );
}