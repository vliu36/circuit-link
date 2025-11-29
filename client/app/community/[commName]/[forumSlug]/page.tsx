// This page displays the list of posts within a specific forum of a community.
"use client"

import { useState, useEffect } from "react";
import { useAuth } from "../../../_firebase/context.tsx";
import { use, useRef } from "react";
import Link from "next/link";
import { fetchPostsByForum, createPost, editPost, deletePostById, votePost, editForum, getMediaUrl, reportPost, searchPosts } from "./forum.ts";
import styles from "./forumPage.module.css";
import { Post, Forum } from "../../../_types/types.ts";
import { useCallback } from "react";
import NavBar from '../../../_components/navbar/navbar.tsx';
import { Community } from "../../../_types/types.ts";
import { useRouter } from "next/navigation";
import { fetchStructure } from "../community.ts";
// import { uploadImage, uploadVideo } from "../../../_utils/mediaUpload.ts";
import Image from "next/image";
import * as commApi from "../community";
import thumbsDown from "../../../../public/thumbs-down-regular-full.svg"
import thumbsUp from "../../../../public/thumbs-up-regular-full.svg"
import commentIcon from "../../../../public/comment-regular-full.svg"
import checkedthumbsDown from "../../../../public/thumbs-down-glow-full.svg"
import checkedthumbsUp from "../../../../public/thumbs-up-glow-full.svg"
import { fetchTopCommunities, fetchTopUsers, getCommunities } from "@/app/landing.ts";
import YourCommunities from "../../../_components/yourCommunities/yourCommBar.tsx";
import { DocumentData } from "firebase/firestore";
import ServerBar from "../../../_components/serverBar/serverBar.tsx"
import editButton from "../../../../public/pencil-solid-full.svg"
import chatutton from "../../../../public/message-solid-full.svg"
import trashBin from "../../../../public/trash-solid-full.svg"
import reportIcon from "../../../../public/flag-solid-full.svg"

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
    // const [showCreateForum, setShowCreateForum] = useState<{ [key: string]: boolean }>({});
    const [showCreateForum, setShowCreateForum] = useState(false);
    const [reportPopup, setReportPopup] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [postId, setPostId] = useState<string>("");
    const [userCommunities, setUserCommunities] = useState<DocumentData[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [confirmDeleteForum, setConfirmDeleteForum] = useState(false);
    const [deleteForumId, setDeleteForumId] = useState<string>("");
    const [deleteForumName, setDeleteForumName] = useState<string>("");
    const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
    const [deleteGroupId, setDeleteGroupId] = useState<string>("");
    const [deleteGroupName, setDeleteGroupName] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [createPostOpen, setCreatePostOpen] = useState(false);

    // --- Delete Post State Variables---
    const [deletePostOpen, setDeletePostOpen] = useState(false);
    const [deletePostId, setDeletePostId] = useState<string>("");

    const [groupId, setGroupId] = useState<string>("");

    const [createGroupOpen, setCreateGroupOpen] = useState(false);

    const [iconOpen, setIconOpen] = useState(false);
    const [bannerOpen, setBannerOpen] = useState(false);
    const [modOptionsOpen, setModOptionsOpen] = useState(false);
    const [blacklistOpen, setBlacklistOpen] = useState(false);

    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [targetUserId, setTargetUserId] = useState<string>("");

    // --- Toggle popups ---
    const toggleCreatePostPopup = () => {
        setCreatePostOpen(!createPostOpen);
        setError(null);
    };

    const toggleCreateGroupPopup = () => {
        setCreateGroupOpen(!createGroupOpen);
        setError(null);
    };

    const handleCreateForumBox = async () => {
        setShowCreateForum(!showCreateForum);
        setError(null);
    };

    const toggleDeletePostPopup = () => {
        setDeletePostOpen(!deletePostOpen);
        setError(null);
    };

    const toggleIconPopup = () => {
        setIconOpen(!iconOpen);
        setError(null);
    };
    const toggleBannerPopup = () => {
        setBannerOpen(!bannerOpen);
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

    useEffect(() => {
        if (loading) return;

        async function loadData() {
            // const comms = await fetchTopCommunities();
            // const users = await fetchTopUsers();

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

            // Close popup card and refresh community structure
            handleCreateForumBox();
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

    if (!community) {
        return <div>Retrieving community data...</div>;
    }

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
    const handleDeletePost = async (postId: string) => {
        // if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            // const msg = await deletePostById(postId, commName);
            await deletePostById(postId, commName);
            // alert(msg);
            fetchPosts();
        } catch (err) {
            console.error(err);
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
            await commApi.changeCommunityBanner(bannerFile, community?.id);
            toggleBannerPopup();
            setBannerFile(null);
            setBannerPreview(null);
            await refreshCommunity();
        } catch (err) {
            console.error("Failed to upload banner:", err);
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

    // -------- MODERATION FUNCTIONS -------- //
    // TODO: The rest of the functions are yet to be imported from the old community page
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

    const isMember = community?.userList.some(m => m.id === user?.uid);
    const isMod = community?.modList.some(m => m.id === user?.uid);
    const isOwner = community?.ownerList.some(o => o.id === user?.uid);
    const isBanned = community?.blacklist.some(b => b.id === user?.uid);

    if (isBanned) {
        return <div>You are banned from this community.</div>;
    }

    // If the community is private and the user is not a member, show this community is private message
    if (!community.public && !isMember) {
        return (<div>This community is private.</div>);
        // TODO : Add request to join functionality
    }
    // Search posts in forum
    const handlePostSearch = async (query: string) => {
        try {
            const { matchingPosts } = await searchPosts(commName, forumSlug, query);

            const formattedPosts = (matchingPosts || []).map((post: Post) => ({
                ...post,
                timePosted: post.timePosted ? new Date(post.timePosted).toLocaleString() : "Unknown",

            }));

            setPosts(formattedPosts);
        }
        catch (err) {
            console.log("Post search failed: ", err);
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <div className={styles.background}>
                <div style={{ gridArea: "NavBar" }}>
                    <NavBar />
                </div>

                <div className={styles.yourCommunitiesBar} style={{ gridArea: "CommunitiesBar" }}>
                    <YourCommunities userCommunities={userCommunities} />
                </div>

                <div className={styles.serverBar} style={{ gridArea: "ServerBar" }}>
                    <ServerBar params={{
                        commName: commName
                    }} />
                </div>



                <div className={styles.RightBar} style={{ gridArea: "RightBar" }}>
                    <div className={styles.channelInfoBox}>
                        <div className={styles.channelInfoh1}>{forumSlug}</div>
                        <div className={styles.channelInfoh2}>{forum.description}</div>
                    </div>
                    <div className={styles.horizontalLine}></div>
                    <div className={styles.RulesBar}>
                        <div className={styles.RulesTitle}>Rules</div>
                        {/* Display rules here */}
                        <p className={styles.RulesText}>{community?.rules}</p>
                    </div>
                </div>

                <div className={styles.createBox}>
                    {user ? (
                        <button className={styles.primaryButton} onClick={toggleCreatePostPopup}>
                            <strong>+ Create New Post</strong>
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
                        <div className={styles.bannerBox}>
                            {/* --- COMMUNITY BANNER --- -------- Click on banner, if mod/owner, to change the banner */}
                            {(isOwner || isMod) ? (
                                <button
                                    className={styles.bannerBox}
                                    onClick={toggleBannerPopup}
                                    style={{ padding: 0, border: 'none', background: 'none', display: 'inline-block' }}
                                >
                                    <Image
                                        src={community.banner}
                                        alt="Community Banner"
                                        width={800}
                                        height={200}
                                        className={styles.bannerBox}
                                        style={{ display: 'block' }}
                                    />
                                </button>
                            ) : (
                                <Image
                                    src={community.banner}
                                    alt="Community Banner"
                                    width={800}
                                    height={200}
                                    className={styles.bannerBox}
                                />
                            )}
                        </div>
                        <div className={styles.titleBox}>
                            <div className={styles.serverIcon}>
                                {/* If user is an owner or mod, allow them to change the icon */}
                                {isOwner || isMod ? (
                                    <button
                                        className={styles.editIconButton} // ! There is no style for this yet
                                        onClick={toggleIconPopup}
                                        style={{ padding: 0, border: 'none', background: 'none' }}
                                    >
                                        <Image
                                            src={community.icon}
                                            alt="Community Icon"
                                            width={150}
                                            height={150}
                                            className={styles.serverIcon}
                                        />
                                    </button>
                                ) : (
                                    // Otherwise, just display the icon
                                    <Image
                                        src={community.icon}
                                        alt="Community Icon"
                                        width={150}
                                        height={150}
                                        className={styles.serverIcon}
                                    />
                                )}
                            </div>
                            <div className={styles.titleText}>
                                {commName}
                                {/* Button that toggles edit forum popup */}
                                <button className={styles.editForumButton} onClick={() => setEditPopup(true)}>
                                    <Image
                                        src={editButton}
                                        height={40}
                                        width={40}
                                        alt="edit"
                                    />
                                </button>
                                {/* Show link to chat if user is member */}
                                {isMember && (
                                    <button className={styles.chatLink}>
                                        <Link href={`/community/${commName}/chat`} >
                                            <Image
                                                src={chatutton}
                                                height={40}
                                                width={40}
                                                alt="chat"
                                            />
                                        </Link>
                                    </button>

                                )}
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
                            {!isMember ? (
                                    <button className={styles.joinCommunityButton} onClick={handleJoin}>Join Community</button>
                                ) : (
                                    <button className={styles.joinCommunityButton} onClick={handleLeave}>Leave Community</button>
                                )}
                        </div>

                        <input
                            className={styles.postSearchBar}
                            placeholder="Search this forum..."
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!searchQuery) {
                                    fetchPosts();
                                }
                            }}
                        />
                        <button
                            className={styles.enterSearch}
                            onClick={() => {
                                handlePostSearch(searchQuery);
                                setSearchQuery("");
                            }}>
                            Search
                        </button>

                    </div>





                    {/* --- Posts List --- */}

                    <div className={styles.forumBox}>
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
                                            <Link className={styles.user} href={`/profile/${post.authorId}`}>
                                                <Image src={post.authorPFP} alt={`${post.authorUsername}'s profile picture`} width={20} height={20} className={styles.userProfile} />
                                                <div className={styles.authorText}>
                                                    {post.authorUsername}
                                                </div>

                                            </Link>

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
                                                    <div className={styles.mediaBackground}>
                                                        <div className={styles.mediaInPost}>
                                                            {post.media.endsWith(".mp4") ? (
                                                                <video controls>
                                                                    <source src={post.media} type="video/mp4" />
                                                                </video>
                                                            ) : (
                                                                <Image src={post.media} alt="Post Media" width={500} height={500} />
                                                            )}
                                                        </div>
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
                                                                width={50}
                                                                height={50}
                                                                alt="commentIcon"
                                                            />
                                                        </div>
                                                        <div className={styles.ratioScore} style={{ gridArea: "ratio" }}>
                                                            {post.replyCount}
                                                        </div>

                                                    </div>
                                                    {/* Report button */}
                                                    <div className={styles.utilButtons}>
                                                        <button
                                                            className={styles.postReportButton}
                                                            onClick={() => {
                                                                toggleReportPopup();
                                                                setPostId(post.id);
                                                            }}
                                                        >
                                                            <Image
                                                                src={reportIcon}
                                                                height={30}
                                                                width={30}
                                                                alt="edit"
                                                            />
                                                        </button>


                                                        {/* Edit and delete buttons */}

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
                                                                <Image
                                                                    src={editButton}
                                                                    height={30}
                                                                    width={30}
                                                                    alt="edit"
                                                                />
                                                            </button>
                                                        )}


                                                        {/* Delete button */}
                                                        {(isAuthor || isMod || isOwner) && (
                                                            <button
                                                                className={styles.deleteButton}
                                                                onClick={() => {
                                                                    setDeletePostId(post.id);
                                                                    toggleDeletePostPopup();
                                                                }}
                                                            >
                                                                <Image
                                                                    src={trashBin}
                                                                    height={30}
                                                                    width={30}
                                                                    alt="edit"
                                                                />
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
                        <p className={styles.popupText}>Are you sure you want to delete forum &quot;{deleteForumName}&quot;? <br /> This action cannot be undone.</p>
                        <button onClick={toggleConfirmDeleteForum} className={styles.cancelButton}>Cancel</button>
                        <button onClick={() => { handleDeleteForum(deleteForumId); toggleConfirmDeleteForum(); }} className={styles.deleteButtonPopup}>Delete</button>
                    </div>
                </div>
            )}
            {confirmDeleteGroup && (
                <div className={styles.popupOverlay} onClick={toggleConfirmDeleteGroup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Confirm Delete Group</h2>
                        <p className={styles.popupText}>Are you sure you want to delete group &quot;{deleteGroupName}&quot;? <br /> This will delete all of its forums and cannot be undone.</p>
                        <button onClick={toggleConfirmDeleteGroup} className={styles.cancelButton}>Cancel</button>
                        <button onClick={() => { handleDeleteGroup(deleteGroupId); toggleConfirmDeleteGroup(); }} className={styles.deleteButtonPopup}>Delete</button>
                    </div>
                </div>
            )}
            {deletePostOpen && (
                <div className={styles.popupOverlay} onClick={toggleDeletePostPopup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Confirm Delete Post</h2>
                        <p className={styles.popupText}>Are you sure you want to delete this post? <br /> This action cannot be undone.</p>
                        <button onClick={toggleDeletePostPopup} className={styles.cancelButton}>Cancel</button>
                        <button onClick={() => { handleDeletePost(deletePostId); toggleDeletePostPopup(); }} className={styles.deleteButtonPopup}>Delete</button>
                    </div>
                </div>
            )}
            {/* --- CREATE FORUM FORM (only shown if toggled on) --- */}
            {showCreateForum && (
                <div className={styles.popupOverlay} onClick={handleCreateForumBox}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Create a new forum in {groupName}</h2>

                        {/* -------- Forum Name -------- */}
                        <input
                            type="text"
                            placeholder="Forum name"
                            className={`${styles.popupText} ${styles.inputField}`}
                            value={forumInputs[groupId]?.name || ""}
                            onChange={(e) =>
                                setForumInputs((prev) => ({
                                    ...prev,
                                    [groupId]: {
                                        ...prev[groupId],
                                        name: e.target.value,
                                        message: "",
                                    },
                                }))
                            }
                            style={{ border: "1px solid #888" }}
                        />

                        {/* -------- Forum Description -------- */}
                        <textarea
                            placeholder="Type description here"
                            className={`${styles.popupText} ${styles.inputField}`}
                            value={forumInputs[groupId]?.description || ""}
                            onChange={(e) =>
                                setForumInputs((prev) => ({
                                    ...prev,
                                    [groupId]: { ...prev[groupId], description: e.target.value, message: "" },
                                }))
                            }
                            style={{ border: "1px solid #888" }}
                        />

                        {/* -------- Submit -------- */}
                        <button
                            className={styles.createForumButton}
                            onClick={() => {
                                handleCreateForum(groupId);
                            }}
                        >
                            Create Forum
                        </button>
                        {forumInputs[groupId]?.message && (
                            <p>{forumInputs[groupId].message}</p>
                        )}
                    </div>
                </div>
            )}
            {/* --- ICON POPUP --- */}
            {iconOpen && (
                <div className={styles.popupOverlay} onClick={toggleIconPopup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Change Community Icon</h2>

                        {/* Preview the uploaded image */}
                        {iconPreview && (
                            <div style={{ marginBottom: "1rem" }}>
                                <Image src={iconPreview} alt="Preview Icon" width={80} height={80} />
                            </div>
                        )}

                        {/* File upload input and buttons to change the icon or close the popup */}
                        <input type="file" accept="image/*" className={`${styles.inputField} ${styles.popupText}`} onChange={handleIconChange} />
                        <button className={`${styles.saveBtn} ${styles.popupText}`} onClick={submitIcon}>
                            Save Icon
                        </button>
                        <button className={`${styles.closeBtn} ${styles.popupText}`} onClick={toggleIconPopup}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* --- BANNER POPUP --- */}
            {bannerOpen && (
                <div className={styles.popupOverlay} onClick={toggleBannerPopup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Change Community Banner</h2>

                        {/* Preview the uploaded image */}
                        {bannerPreview && (
                            <div style={{ marginBottom: "1rem" }}>
                                <Image src={bannerPreview} alt="Preview Banner" width={800} height={200} />
                            </div>
                        )}

                        {/* File upload input and buttons to change the banner or close the popup */}
                        <input type="file" accept="image/*" className={`${styles.inputField} ${styles.popupText}`} onChange={handleBannerChange} />
                        <button className={`${styles.saveBtn} ${styles.popupText}`} onClick={submitBanner}>
                            Save Banner
                        </button>
                        <button className={`${styles.closeBtn} ${styles.popupText}`} onClick={toggleBannerPopup}>
                            Close
                        </button>
                    </div>
                </div>
            )}
            {/* --- MOD OPTIONS POPUP --- */}
            {modOptionsOpen && (
                <div className={styles.popupOverlay} onClick={toggleModOptionsPopup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Mod Options</h2>
                        {/* Add mod options content here */}
                        <button className={`${styles.popupText} ${styles.closeBtn}`} onClick={handleKickUser}>
                            Kick User
                        </button>
                        <button className={`${styles.popupText} ${styles.closeBtn}`} onClick={handleBanUser}>
                            Ban User
                        </button>
                        {error && <p style={{ color: "yellow" }}>{error}</p>}
                    </div>
                </div>
            )}
            {/* --- BLACKLIST POPUP --- */}
            {blacklistOpen && (
                <div className={styles.popupOverlay} onClick={toggleBlacklistPopup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Blacklist</h2>
                        {/* Displays each user's name in the blacklist; if empty show a message */}
                        <ul>
                            {community.blacklist.length === 0 ? (
                                <p>The blacklist is empty.</p>
                            ) : (
                                community.blacklist.map((bannedUser) => (
                                    <li key={bannedUser.id} className={styles.popupText}>
                                        {/* User's profile picture */}
                                        <Image src={bannedUser.photoURL} alt={bannedUser.username} width={40} height={40} />
                                        {/* Link to their profile */}
                                        <Link href={`/profile/${bannedUser.id}`}>
                                            {bannedUser.username}
                                        </Link>
                                        {/* Button to unban the user */}
                                        <button className={`${styles.popupText} ${styles.saveBtn}`} onClick={() => {
                                            handleUnbanUser(bannedUser.id);
                                        }}>
                                            Unban User
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                        {error && <p style={{ color: "yellow" }}>{error}</p>}
                        <button className={`${styles.popupText} ${styles.closeBtn}`} onClick={toggleBlacklistPopup}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}