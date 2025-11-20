// This page displays the list of posts within a specific forum of a community.
"use client"

import { useState, useEffect } from "react";
import { useAuth } from "../../../_firebase/context.tsx";
import { use, useRef } from "react";
import Link from "next/link";
import { fetchPostsByForum, createPost, editPost, deletePostById, votePost, editForum, getMediaUrl, reportPost } from "./forum.ts";
import styles from "./forumPage.module.css";
import { Post, Forum } from "../../../_types/types.ts";
import { useCallback } from "react";
import NavBar from '../../../_components/navbar/navbar.tsx';
import { Community } from "../../../_types/types.ts";
import { useRouter } from "next/navigation";
import { fetchStructure } from "../community.ts";
import { uploadImage, uploadVideo } from "../../../_utils/mediaUpload.ts";
import Image from "next/image";
import * as commApi from "../community";
import thumbsDown from "../../../../public/thumbs-down-regular-full.svg"
import thumbsUp from "../../../../public/thumbs-up-regular-full.svg"
import commentIcon from "../../../../public/comment-regular-full.svg"
import checkedthumbsDown from "../../../../public/thumbs-down-glow-full.svg"
import checkedthumbsUp from "../../../../public/thumbs-up-glow-full.svg"
import { fetchTopCommunities, fetchTopUsers, getCommunities } from "@/app/landing.ts";

export default function ForumPage({
    params,
}: {
    params: Promise<{ commName: string; forumSlug: string }>;
}) {
    const { commName, forumSlug } = use(params);
    const { user } = useAuth();
    const { userData } = useAuth();
    const [community, setCommunity] = useState<Community | null | undefined>(undefined);
    const [posts, setPosts] = useState<Post[]>([]);
    const [title, setTitle] = useState("");
    const [contents, setContents] = useState("");
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContents, setEditContents] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [groupName, setGroupName] = useState("");
    const [groupMessage, setGroupMessage] = useState("");
    const [sortMode, setSortMode] = useState<string>("newest"); // "newest" | "oldest" | "mostYays" | "alphabetical"
    const [forumInputs, setForumInputs] = useState<{ [groupId: string]: { name: string; description: string; message: string } }>({});
    const [editGroupOpen, setEditGroupOpen] = useState(false);
    const [forum, setForum] = useState<Forum | null>(null);
    const [loading, setLoading] = useState(true);
    const [editGroupId, setEditGroupId] = useState<string>("");
    const [editPopup, setEditPopup] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();
    const [showCreateForum, setShowCreateForum] = useState<{ [key: string]: boolean }>({});
    const [reportPopup, setReportPopup] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [postId, setPostId] = useState<string>("");
    const [userCommunities, setUserCommunities] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [confirmDeleteForum, setConfirmDeleteForum] = useState(false);
    const [deleteForumId, setDeleteForumId] = useState<string>("");
    const [deleteForumName, setDeleteForumName] = useState<string>("");
    const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
    const [deleteGroupId, setDeleteGroupId] = useState<string>("");
    const [deleteGroupName, setDeleteGroupName] = useState<string>("");

    const [createPostOpen, setCreatePostOpen] = useState(false);

    const toggleCreatePostPopup = () => {
        setCreatePostOpen(!createPostOpen);
        setError(null);
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


    const [createGroupOpen, setCreateGroupOpen] = useState(false);

    const toggleCreateGroupPopup = () => {
        setCreateGroupOpen(!createGroupOpen);
        setError(null);
    };

    const handleCreateForumBox = async (groupId: string) => {
        setShowCreateForum({});
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

    // --- DELETE GROUP ---
    const handleDeleteGroup = async (groupId: string) => {
        if (!user) return;
        try {
            // Check if user is currently viewing a forum within the group being deleted
            let reroute = false;
            if (forum && forum.parentGroup === groupId) {
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

    // ------ Toggles for popups ------
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
            // Check if user is currently viewing the forum being deleted
            let reroute = false;
            if (forum?.name === deleteForumName) {
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

    // Toggle edit forum popup
    const toggleEditPopup = () => {
        setEditPopup(!editPopup);
        setMessage(null);
    }

    // Toggle report post popup
    const toggleReportPopup = () => {
        setReportPopup(!reportPopup);
        setReportReason("");
        setPostId("");
        setMessage(null);
    };

    /** Fetch posts by forum
     *  This is used to load posts when the component mounts and after actions like adding, editing, or deleting a post.
     */
    const fetchPosts = useCallback(async () => {
        try {
            const { forum, posts } = await fetchPostsByForum(commName, forumSlug, sortMode);

            const formattedPosts = (posts || []).map((p: Post) => ({
                ...p,
                timePosted: p.timePosted
                    ? new Date(p.timePosted).toLocaleString()
                    : "Unknown",
            }));

            setForum(forum);
            setPosts(formattedPosts);
        } catch (err) {
            console.error("Failed to fetch forum:", err);
        } finally {
            setLoading(false);
        }
    }, [commName, forumSlug, sortMode]);

    // Initial fetch and refetch on sort mode change
    useEffect(() => {
        fetchPosts();
    }, [commName, forumSlug, fetchPosts]);

    // Fetch community structure
    useEffect(() => {
        setLoading(true);
        fetchStructure(commName)
            .then((data) => {
                if (data) setCommunity(data);
            })
            .finally(() => setLoading(false));
    }, [commName]);

    // Handler to add a new post
    const handleAddPost = async () => {
        if (!user) return alert("Sign in to post!");
        if (!title || !contents) return alert("Please fill out title and contents");

        try {

            const res = await getMediaUrl(mediaFile);
            const mediaUrl = res.media || null;

            const msg = await createPost(
                // user.uid, // ! DEPRECATED - now derived from session cookie
                title,
                contents,
                commName,
                forumSlug,
                mediaUrl,
            );

            console.log(msg);
            setTitle("");
            setContents("");
            setMediaFile(null);
            setMediaPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            fetchPosts();
        } catch (err) {
            console.log(err);
            if (err instanceof Error) {
                alert(`Failed to add post: ${err.message}`);
            } else {
                alert("Failed to add post due to an unknown error.");
            }
        }
    };

    // Handler to save edited post
    const handleSaveEdit = async (postId: string) => {
        try {
            const msg = await editPost(postId, editTitle, editContents);
            console.log(msg);
            cancelEditing();
            fetchPosts();
        } catch (err) {
            console.error("Failed to edit post:", err);
        }
    };
    const cancelEditing = () => {
        setEditingPostId(null);
        setEditTitle("");
        setEditContents("");
    };

    // Handler to delete a post
    const handleDeletePost = async (postId: string, commName: string) => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            const msg = await deletePostById(postId, commName);
            alert(msg);
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    // Handler to vote on a post
    // !!! UPDATED !!! ---------------- This now uses optimistic UI updates for a snappier experience
    const handleVote = async (postId: string, type: "yay" | "nay") => {
        if (!user) return alert("Sign in to vote!");

        setPosts((prevPosts) =>
            prevPosts.map((p) => {
                if (p.id !== postId) return p;

                const hasYay = p.yayList.includes(user.uid);
                const hasNay = p.nayList.includes(user.uid);

                let newYayList = [...p.yayList];
                let newNayList = [...p.nayList];

                if (type === "yay") {
                    if (hasYay) {
                        // Undo yay
                        newYayList = newYayList.filter((id) => id !== user.uid);
                    } else {
                        newYayList.push(user.uid);
                        // Remove nay if exists
                        if (hasNay) newNayList = newNayList.filter((id) => id !== user.uid);
                    }
                } else if (type === "nay") {
                    if (hasNay) {
                        // Undo nay
                        newNayList = newNayList.filter((id) => id !== user.uid);
                    } else {
                        newNayList.push(user.uid);
                        // Remove yay if exists
                        if (hasYay) newYayList = newYayList.filter((id) => id !== user.uid);
                    }
                }

                return {
                    ...p,
                    yayList: newYayList,
                    nayList: newNayList,
                    yayScore: newYayList.length - newNayList.length,
                };
            })
        );

        // Send vote request in background
        try {
            await votePost(postId, type);
        } catch (err) {
            console.error("Voting failed, rolling back", err);
            // Optionally, refetch posts to rollback
            fetchPosts();
        }
    };

    if (loading) return <div>Loading forum...</div>;
    if (community === undefined) return <div>Loading community...</div>;
    if (community === null) return <div>Community not found.</div>;
    if (!forum) return <div>Forum not found.</div>;

    // Handle edit forum 
    const handleEdit = async (name?: string, description?: string) => {
        try {
            const res = await editForum(forum.id, name, description);
            const oldName = forum.name;
            console.log(res.message);
            setMessage(res.message || null);
            if (res.status === "ok" && name && name !== oldName) {
                router.push(`/community/${commName}/${res.newSlug}`);
            } else if (res.status === "ok") {
                fetchPosts();
                toggleEditPopup();
            }
        } catch (error) {
            setMessage("An error occurred while editing the forum.");
        }
    }

    // Handle media file selection
    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setMediaFile(file);
        if (file) setMediaPreview(URL.createObjectURL(file));
    };

    // Handle report post
    const handleReportPost = async () => {
        if (!user) return alert("Sign in to report posts!");
        if (!reportReason) return alert("Please provide a reason for the report.");
        try {
            const res = await reportPost(commName, postId, reportReason);
            console.log(res.message);
            setMessage(res.message || null);
            // wait a bit then close popup
            setTimeout(() => {
                toggleReportPopup();
            }, 3000);
        } catch (error) {
            console.error("Error reporting post:", error);
            alert("An error occurred while reporting the post.");
        }
    };

    const isMod = community?.modList.some(m => m.id === user?.uid);
    const isOwner = community?.ownerList.some(o => o.id === user?.uid);
    const isBanned = community?.blacklist.some(b => b.id === user?.uid);

    if (isBanned) {
        return <div>You are banned from this community.</div>;
    }



    return (
        <main>
            <div className={styles.background}>
                <div className={styles.navBox} style={{ gridArea: "NavBar" }}>
                    <NavBar />
                </div>

                <div className={styles.yourCommunitiesBar} style={{ gridArea: "CommunitiesBar" }}>
                    <h1>Your Communities</h1>

                    <div>
                        {userCommunities.length === 0 ? (
                            <p>No joined communities.</p>
                        ) : (
                            userCommunities.map((c: any, i: number) => (
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
                            <button

                                onClick={toggleCreateGroupPopup}
                            >
                                +
                            </button>
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
                    <div className={styles.channelInfoBox}>
                        <div className={styles.channelInfoh1}>{forumSlug}</div>
                        <div className={styles.channelInfoh2}>{forum.description}</div>
                    </div>
                    <div className={styles.horizontalLine}></div>
                    <div className={styles.RulesBar}>
                        Rules
                    </div>
                </div>

                <div className={styles.createBox}>
                    {user ? (
                        <button className={styles.primaryButton} onClick={toggleCreatePostPopup}>
                            + Create New Post
                        </button>
                    ) : (
                        <p>Please sign in to create posts.</p>
                    )}
                    {createPostOpen && (
                        <div className={styles.popupOverlay} onClick={toggleCreatePostPopup}>
                            <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>

                                <h2 className={styles.popupText}>Create New Post</h2>

                                {/* Post Title */}
                                <input
                                    placeholder="Post Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`${styles.popupText} ${styles.inputField}`}
                                    style={{ marginBottom: "1rem" }}
                                />

                                {/* Media Upload w/ Preview */}
                                <div className={styles.mediaOut}>
                                    {mediaPreview && (
                                        <img
                                            src={mediaPreview}
                                            alt="Media preview"
                                            className={styles.mediaPreview}
                                        />
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        ref={fileInputRef}
                                        onChange={handleMediaChange}
                                        className={`${styles.inputField}`}
                                    />
                                </div>

                                {/* Content */}
                                <textarea
                                    placeholder="Post Contents"
                                    value={contents}
                                    onChange={(e) => setContents(e.target.value)}
                                    className={`${styles.popupText} ${styles.inputField}`}
                                    style={{ height: "120px" }}
                                />

                                {/* Submit Button */}
                                <button
                                    className={`${styles.saveBtn} ${styles.popupText}`}
                                    onClick={async () => {
                                        await handleAddPost();
                                        toggleCreatePostPopup();
                                    }}
                                >
                                    Add Post
                                </button>

                                {/* Close Button */}
                                <button
                                    className={`${styles.closeBtn} ${styles.popupText}`}
                                    onClick={toggleCreatePostPopup}
                                >
                                    Close
                                </button>

                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.centerPage} style={{ gridArea: "Center" }}>
                    <div className={styles.topBox}>
                        <div className={styles.bannerBox}></div>
                        <div className={styles.titleBox}>
                            <div className={styles.serverIcon}></div>
                            <div className={styles.titleText}>
                                {commName}
                                {/* Button that toggles edit forum popup */}
                                <button className={styles.editForumButton} onClick={() => setEditPopup(true)}>
                                    Edit
                                </button>
                                {/* Drop down menu to change sort mode */}
                                <div className={styles.sortDropdown}>
                                    <div className={styles.sortText}>
                                        <label htmlFor="sortMode">Sort by: </label>
                                        <select
                                            id="sortMode"
                                            value={sortMode}
                                            onChange={(e) => setSortMode(e.target.value)}
                                        >
                                            <option value="newest">Newest</option>
                                            <option value="oldest">Oldest</option>
                                            <option value="mostYays">Most Yays</option>
                                            <option value="alphabetical">Alphabetical</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <textarea className={styles.postSearchBar}>

                        </textarea>
                        <button className={styles.enterSearch}>Search</button>

                    </div>





                    {/* --- Posts List --- */}

                    <div className={styles.forumBox}>
                        <div style={{ textIndent: "5%", marginTop: "2vw", marginBottom: "0.5vw" }}>Forum Posts</div>
                        {posts.length === 0 ? (
                            <p>No posts found in this forum.</p>
                        ) : (
                            posts.map((post) => {
                                // Check if the current user is the author of the post
                                const isAuthor = post.authorId === user?.uid;
                                // Check if the post is currently being edited
                                const isEditing = editingPostId === post.id;

                                return (
                                    <div key={post.id} className={styles.postCard}>
                                        {/* ---- Post metadata ---- */}
                                        {/* Post author */}
                                        <div className={styles.postHeading}>
                                            <div className={styles.user}>
                                                <div className={styles.userProfile}>
                                                    <Image src={post.authorPFP} alt={`${post.authorUsername}'s profile picture`} width={20} height={20} className={styles.userProfile} />
                                                </div>
                                                <Link href={`/profile/${post.authorId}`}>
                                                    {post.authorUsername}
                                                </Link>
                                            </div>

                                            {/* Time post was created, and if it was edited */}
                                            <p className={styles.time}>
                                                {post.timePosted} {post.edited && "(edited)"}
                                            </p>
                                        </div>

                                        {/* If the post is being edited, show input fields */}
                                        {isEditing ? (
                                            <>
                                                {/* Title input */}
                                                <input
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    className={styles.input}
                                                />

                                                {/* Contents textarea */}
                                                <textarea
                                                    value={editContents}
                                                    onChange={(e) => setEditContents(e.target.value)}
                                                    className={styles.textarea}
                                                />

                                                {/* Save button */}
                                                <button
                                                    onClick={() => handleSaveEdit(post.id)}
                                                    className={`${styles.button} ${styles.saveButton}`}
                                                >
                                                    Save
                                                </button>

                                                {/* Cancel button */}
                                                <button
                                                    onClick={cancelEditing}
                                                    className={`${styles.button} ${styles.cancelButton}`}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {/* Post title and contents, linked to the post details page */}
                                                <Link href={`/community/${commName}/${forumSlug}/${post.id}`}>
                                                    <h3 className={styles.title}>{post.title}</h3>
                                                </Link>
                                                {/* Display media if available */}
                                                {post.media && (
                                                    <div className={styles.mediaInPost}>
                                                        {post.media.endsWith(".mp4") ? (
                                                            <video controls>
                                                                <source src={post.media} type="video/mp4" />
                                                            </video>
                                                        ) : (
                                                            <Image src={post.media} alt="Post Media" width={350} height={150} />
                                                        )}
                                                    </div>
                                                )}

                                                <div className={styles.contents}>{post.contents}</div>




                                                <div className={styles.likesCommentsShare}>
                                                    <div className={styles.actions}>
                                                        {/* ---- Vote buttons ---- */}
                                                        {/* If the user has already voted, show their vote status (green for yay) */}
                                                        <button
                                                            onClick={() => handleVote(post.id, "yay")}
                                                            className={`${styles.voteButton} ${post.yayList.includes(user?.uid || "") ? styles.yayActive : ""
                                                                }`}
                                                            style={{ gridArea: "Yays" }}
                                                        >
                                                            <div className={styles.imageAlignmentInButton}>
                                                                <Image
                                                                    src={post.yayList.includes(user?.uid || "") ? checkedthumbsUp : thumbsUp}
                                                                    alt="Yays"
                                                                    width={30}
                                                                    height={30}
                                                                />
                                                            </div>
                                                        </button>


                                                        {/* Yay score and reply count */}
                                                        <p className={styles.yayScore} style={{ gridArea: "score" }}>
                                                            {post.yayScore}
                                                        </p>

                                                        {/* If the user has already voted, show their vote status (red for nay) */}
                                                        <button
                                                            onClick={() => handleVote(post.id, "nay")}
                                                            className={`${styles.voteButton} ${post.nayList.includes(user?.uid || "") ? styles.nayActive : ""
                                                                }`}
                                                            style={{ gridArea: "Nays", borderRadius: "0 1vw 1vw 0" }}
                                                        >
                                                            <div className={styles.imageAlignmentInButton}>
                                                                <Image
                                                                    src={post.nayList.includes(user?.uid || "") ? checkedthumbsDown : thumbsDown}
                                                                    alt="Nays"
                                                                    width={30}
                                                                    height={30}
                                                                />
                                                            </div>

                                                        </button>


                                                    </div>

                                                    <div className={styles.commentsBox}>
                                                        <div className={styles.commentIcon} style={{ gridArea: "icon" }}>
                                                            <Image
                                                                src={commentIcon}
                                                                width={30}
                                                                height={30}
                                                                alt="commentIcon"
                                                            />
                                                        </div>
                                                        <div className={styles.ratioScore} style={{ gridArea: "ratio" }}>
                                                            {post.replyCount}
                                                        </div>

                                                    </div>
                                                    {/* Report button */}
                                                    <div className={styles.postReportButton}>
                                                        <button
                                                            onClick={() => {
                                                                toggleReportPopup();
                                                                setPostId(post.id);
                                                            }}

                                                        >
                                                            Report
                                                        </button>
                                                    </div>

                                                    {/* Edit and delete buttons */}

                                                    <div >
                                                        {/* Edit button */}
                                                        {isAuthor && (
                                                            <button
                                                                className={styles.editButton}
                                                                onClick={() => {
                                                                    setEditingPostId(post.id);
                                                                    setEditTitle(post.title);
                                                                    setEditContents(post.contents);
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                    </div>


                                                    <div >
                                                        {/* Delete button */}
                                                        {(isAuthor || isMod || isOwner) && (
                                                            <button
                                                                className={styles.deleteButton}
                                                                onClick={() => handleDeletePost(post.id, commName)}
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                {/* Edit Forum Popup */}
                {editPopup && (
                    <div className={styles.popupOverlay} onClick={toggleEditPopup}>
                        <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                            <h2 className={styles.popupText}>Edit Forum</h2>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const nameInput = form.elements.namedItem("name") as HTMLInputElement;
                                const descInput = form.elements.namedItem("description") as HTMLInputElement;
                                await handleEdit(nameInput.value, descInput.value);
                            }}>
                                <label className={styles.popupText}>
                                    Forum Name:
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Forum Name"
                                        defaultValue={forum?.name}
                                        className={styles.input}
                                    />
                                </label>
                                <label className={styles.popupText}>
                                    Forum Description:
                                    <textarea
                                        name="description"
                                        placeholder="Forum Description"
                                        defaultValue={forum?.description}
                                        className={styles.textarea}
                                    />
                                </label>
                                <button type="submit" className={`${styles.popupText} ${styles.saveBtn}`}>
                                    Save Changes
                                </button>
                            </form>
                            <button className={`${styles.closeBtn} ${styles.popupText}`} onClick={toggleEditPopup}>
                                Close
                            </button>

                            {message && <p>{message}</p>}
                        </div>
                    </div>
                )}
                {/* Report Post Popup */}
                {reportPopup && (
                    <div className={styles.popupOverlay} onClick={toggleReportPopup}>
                        <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                            <h2 className={styles.popupText}>Report Post</h2>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                await handleReportPost();
                            }}>
                                <label className={styles.popupText}>
                                    Reason for Report:
                                    <textarea
                                        name="reason"
                                        placeholder="Describe the reason for reporting this post. (100 character max)"
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className={styles.textarea}
                                        maxLength={100}
                                    />
                                </label>

                                {message && <p>{message}</p>}
                                <button type="submit" className={`${styles.popupText} ${styles.saveBtn}`}>
                                    Submit Report
                                </button>
                            </form>
                            <button className={`${styles.closeBtn} ${styles.popupText}`} onClick={toggleReportPopup}>
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {confirmDeleteForum && (
                <div className={styles.popupOverlay} onClick={toggleConfirmDeleteForum}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Confirm Delete Forum</h2>
                        <p className={styles.popupText}>Are you sure you want to delete forum "{deleteForumName}"? <br /> This action cannot be undone.</p>
                        <button onClick={toggleConfirmDeleteForum} className={styles.cancelButton}>Cancel</button>
                        <button onClick={() => { handleDeleteForum(deleteForumId); toggleConfirmDeleteForum(); }} className={styles.deleteButton}>Delete</button>
                    </div>
                </div>
            )}
            {confirmDeleteGroup && (
                <div className={styles.popupOverlay} onClick={toggleConfirmDeleteGroup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Confirm Delete Group</h2>
                        <p className={styles.popupText}>Are you sure you want to delete group "{deleteGroupName}"? <br /> This will delete all of its forums and cannot be undone.</p>
                        <button onClick={toggleConfirmDeleteGroup} className={styles.cancelButton}>Cancel</button>
                        <button onClick={() => { handleDeleteGroup(deleteGroupId); toggleConfirmDeleteGroup(); }} className={styles.deleteButton}>Delete</button>
                    </div>
                </div>
            )}
        </main>
    );
}