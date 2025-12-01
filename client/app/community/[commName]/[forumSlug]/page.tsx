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
import cogwheel from "../../../../public/gear.svg"
import shield from "../../../../public/shield.svg"
import listIcon from "../../../../public/file.svg"

export default function ForumPage({
    params,
}: {
    params: Promise<{ commName: string; forumSlug: string }>;
}) {
    const { commName, forumSlug } = use(params);
    const { user, userData } = useAuth();
    const [community, setCommunity] = useState<Community | null | undefined>(undefined);    // Community data
    const [posts, setPosts] = useState<Post[]>([]);                                         // All posts in the forum
    const [title, setTitle] = useState("");                                                 // Title for new post
    const [contents, setContents] = useState("");                                           // Contents for new post
    const [editingPostId, setEditingPostId] = useState<string | null>(null);                // ID of the post being edited
    const [editTitle, setEditTitle] = useState("");                                         // Title for editing post
    const [editContents, setEditContents] = useState("");                                   // Contents for editing post
    const [error, setError] = useState<string | null>(null);                                // Error message    
    const [groupName, setGroupName] = useState("");                                         // New group name                
    const [groupMessage, setGroupMessage] = useState("");                                   // Message for group creation
    const [sortMode, setSortMode] = useState<string>("newest");                             // Sorting mode, either: "newest" | "oldest" | "mostYays" | "alphabetical"
    const [forumInputs, setForumInputs] = useState<{ [groupId: string]: { name: string; description: string; message: string } }>({}); // Inputs for creating forums
    const [editGroupOpen, setEditGroupOpen] = useState(false);                              // Edit group popup state
    const [forum, setForum] = useState<Forum | null>(null);                                 // Current forum data
    const [loading, setLoading] = useState(true);                                           // Loading state
    // const [editGroupId, setEditGroupId] = useState<string>(""); // ! Moved to server bar
    const [editPopup, setEditPopup] = useState(false);                                      // Edit forum popup state
    const [message, setMessage] = useState<string | null>(null);                            // Message for popups
    const [mediaFile, setMediaFile] = useState<File | null>(null);                          // Media file for new post
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);                  // Preview URL for media file
    const fileInputRef = useRef<HTMLInputElement | null>(null);                             // Ref for file input
    const router = useRouter();                                                             // Next.js router
    // const [showCreateForum, setShowCreateForum] = useState<{ [key: string]: boolean }>({});
    const [showCreateForum, setShowCreateForum] = useState(false);                          // Show create forum state
    const [reportPopup, setReportPopup] = useState(false);                                  // Report popup state
    const [reportReason, setReportReason] = useState("");                                   // Reason for reporting
    const [postId, setPostId] = useState<string>("");                                       // ID of the post being reported
    const [userCommunities, setUserCommunities] = useState<DocumentData[]>([]);             // User's communities
    const [dataLoading, setDataLoading] = useState(true);                                   // Data loading state
    const [confirmDeleteForum, setConfirmDeleteForum] = useState(false);                    // Confirm delete forum popup state
    const [deleteForumId, setDeleteForumId] = useState<string>("");                         // ID of the forum to delete
    const [deleteForumName, setDeleteForumName] = useState<string>("");                     // Name of the forum to delete
    const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);                    // Confirm delete group popup state
    const [deleteGroupId, setDeleteGroupId] = useState<string>("");                         // ID of the group to delete
    const [deleteGroupName, setDeleteGroupName] = useState<string>("");                     // Name of the group to delete
    const [searchQuery, setSearchQuery] = useState<string>("");                             // Search query

    const [createPostOpen, setCreatePostOpen] = useState(false);                            // Create post popup state

    // --- Delete Post State Variables---
    const [deletePostOpen, setDeletePostOpen] = useState(false);                            // Delete post popup state
    const [deletePostId, setDeletePostId] = useState<string>("");                           // ID of the post to delete

    const [groupId, setGroupId] = useState<string>("");

    const [createGroupOpen, setCreateGroupOpen] = useState(false);                          // Create group popup state

    const [iconOpen, setIconOpen] = useState(false);                                        // Icon edit popup state
    const [bannerOpen, setBannerOpen] = useState(false);                                    // Banner edit popup state
    const [modOptionsOpen, setModOptionsOpen] = useState(false);                            // Moderator options popup state
    const [blacklistOpen, setBlacklistOpen] = useState(false);                              // Blacklist popup state

    const [iconFile, setIconFile] = useState<File | null>(null);                            // Icon file for community
    const [iconPreview, setIconPreview] = useState<string | null>(null);                    // Icon preview URL
    const [bannerFile, setBannerFile] = useState<File | null>(null);                        // Banner file for community
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);                // Banner preview URL
    const [targetUserId, setTargetUserId] = useState<string>("");                           // Target user ID for mod actions
    const [targetUsername, setTargetUsername] = useState<string>("");                       // Target username for mod actions

    const [alertOpen, setAlertOpen] = useState(false);                                      // Alert popup state

    const [editCommPopup, setEditCommPopup] = useState(false);                              // Edit community popup state

    const [modPopup, setModPopup] = useState(false);                                        // Moderator options popup state


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
        setIconFile(null);
        setIconPreview(null);
    };
    const toggleBannerPopup = () => {
        setBannerOpen(!bannerOpen);
        setError(null);
        setBannerFile(null);
        setBannerPreview(null);
    };

    const toggleModOptionsPopup = () => {
        setModOptionsOpen(!modOptionsOpen);
        setError(null);
    };

    const toggleBlacklistPopup = () => {
        setBlacklistOpen(!blacklistOpen);
        setError(null);
    };

    const toggleAlertPopup = () => {
        setAlertOpen(!alertOpen);
    };

    const toggleEditCommPopup = () => {
        setEditCommPopup(!editCommPopup);
        setError(null);
    };

    const toggleModPopup = () => {
        setModPopup(!modPopup);
        setError(null);
    };

    // EFFECT: Handle bfcache (back/forward cache) issues
    // useEffect(() => {
    // const handlePageShow = (event: PageTransitionEvent) => {
    //     if (event.persisted) {
    //     // Page was restored from bfcache
    //     window.dispatchEvent(new Event("resize")); // trigger layout recalculation
    //     }
    // };

    // window.addEventListener("pageshow", handlePageShow);

    // return () => {
    //     window.removeEventListener("pageshow", handlePageShow);
    // };
    // }, []);

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
        if (res.status === "error") {
            setError(res.message);
            console.log(res.message);
            toggleAlertPopup();
            return;
        }
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

    // --- EDIT COMMUNITY ---
    const handleEditCommunity = async (newName?: string, description?: string, isPublic?: boolean, rules?: string) => {
        try {
            const namePattern = /^[a-zA-Z0-9_-]{1,24}$/;
            if (newName && !namePattern.test(newName)) {
                setError("Community name must be 1-24 characters long and can only contain letters, numbers, underscores, and hyphens.");
                return;
            }
            const res = await commApi.editCommunity(commName, newName, description, isPublic, rules);
            console.log(res.message);
            setError(res.message || null);
            if (res.status === "ok" && newName && newName.toLowerCase() !== commName.toLowerCase()) {
                router.push(`/community/${newName}`);
            } else if (res.status === "ok") {
                // Close the edit popup after a brief delay only if the name hasn't changed
                setTimeout(() => {
                    toggleEditCommPopup();
                }, 2000);
                await refreshCommunity();
            }
        } catch (err) {
            setError("Failed to edit community. Please try again.");
            console.error("Error editing community:", err);
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
                console.log("Failed to refresh community: no data returned");
            }
        } catch (err) {
            console.log("Error refreshing community:", err);
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
            if (!result || result.status === "error") {
                setError(result?.message || "Failed to delete forum.");
                return;
            }
            console.log("Forum deleted successfully:", result);

            // Reroute user to community main page after deleting the forum, or refresh community structure
            if (reroute) {
                router.push(`/community/${commName}`);
            } else {
                await refreshCommunity();
            }
        } catch (err) {
            console.warn("Error deleting forum:", err);
            setError("Error deleting forum: " + (err instanceof Error ? err.message : ""));
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
        if (!user) {
            setError("Sign in to post!");
            return;
        }
        if (!title || !contents) {
            setError("Please fill out title and contents");
            return;
        }

        try {
            let media: string | null = null;
            const res = await getMediaUrl(mediaFile);
            if (res.status == "error") {                    // If error occurred during media upload, throw an error to stop process
                setError(res.message);
                throw new Error(res.message);
            } else if (res.status == "ok") {                // If media upload successful, get the media URL
                console.log("Media uploaded successfully:", res.media);
                media = res.media;
            } else if (res.status == "no_media") {          // If no media file provided, set mediaUrl to null
                console.log("No media file provided.");
                media = null;
            } else {
                setError("Unexpected response during media upload.");
                throw new Error("Unexpected response during media upload.");
            }

            const msg = await createPost(
                title,
                contents,
                commName,
                forumSlug,
                media,
            );

            console.log(msg);
            toggleCreatePostPopup();
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
                setError(`Failed to add post: ${err.message}`);
            } else {
                setError("Failed to add post due to an unknown error.");
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
        try {
            // const msg = await deletePostById(postId, commName);
            await deletePostById(postId, commName);
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
            const res = await commApi.changeCommunityIcon(iconFile, community.id);
            if (res.status === "error") {
                throw new Error(res.message);
            }
            toggleIconPopup();
            setIconFile(null);
            setIconPreview(null);
            await refreshCommunity();
        } catch (err) {
            console.warn("Failed to upload icon:", err);
            setError("Failed to upload icon: " + (err instanceof Error ? err.message : ""));
        }
    };

    // Submission for banner
    const submitBanner = async () => {
        if (!bannerFile) return;
        try {
            const res = await commApi.changeCommunityBanner(bannerFile, community?.id);
            if (res.status === "error") {
                throw new Error(res.message);
            }
            toggleBannerPopup();
            setBannerFile(null);
            setBannerPreview(null);
            await refreshCommunity();
        } catch (err) {
            console.warn("Failed to upload banner:", err);
            setError("Failed to upload banner: " + (err instanceof Error ? err.message : ""));
        }
    };

    // Handler to vote on a post
    const handleVote = async (postId: string, type: "yay" | "nay") => {
        if (!user) {
            setError("Sign in to vote on posts!");
            toggleAlertPopup();
            return;
        }

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

    // --- DELETE COMMUNITY ---
    const handleDeleteComm = async (commName: string) => {
        if (!confirm(`Are you sure you want to delete "${commName}"? This action cannot be undone.`)) {
            return;
        }

        await commApi.deleteCommunity(commName);
        console.log("Community successfully deleted.");
        router.push("/");
    }

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
        if (!user) {
            setMessage("Sign in to report posts!");
            return;
        }
        if (!reportReason) {
            setMessage("Please provide a reason for the report.");
            return;
        }

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
            setMessage("An error occurred while reporting the post.");
        }
    };

    // -------- MODERATION FUNCTIONS -------- //
    // Handle kick
    const handleKickUser = async () => {
        try {
            const res = await commApi.kickMember(commName, targetUserId);
            console.log(res.message);
            setError(res.message || null);
            // Wait 1 second and close the popup
            setTimeout(() => {
                toggleModPopup();
            }, 500);
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
                toggleModPopup();
            }, 500);
            await refreshCommunity();
        } catch (err) {
            console.error("Failed to ban user:", err);
            setError("Failed to ban user.");
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
            }, 500);
            await refreshCommunity();
        } catch (err) {
            console.error("Failed to unban user:", err);
        }
    };

    // --- PROMOTE USER TO MOD ---
    const handlePromoteToMod = async () => {
        try {
            const userId = targetUserId;
            const res = await commApi.promoteToMod(commName, userId);
            setError(res.message || null);
            console.log(res.message);
            await refreshCommunity();
            // Close mod popup after a brief delay
            setTimeout(() => {
                toggleModPopup();
            }, 500);
        } catch (err) {
            console.error("Failed to promote user to mod:", err);
            setError("Failed to promote user to mod.");
        }
    };

    // --- DEMOTE MOD TO USER ---
    const handleDemoteMod = async () => {
        try {
            const userId = targetUserId;
            const res = await commApi.demoteMod(commName, userId);
            setError(res.message || null);
            console.log(res.message);
            await refreshCommunity();
            // Close mod popup after a brief delay
            setTimeout(() => {
                toggleModPopup();
            }, 500);
        } catch (err) {
            console.error("Failed to demote mod to user:", err);
            setError("Failed to demote mod to user.");
        }
    };

    // --- PROMOTE USER TO OWNER ---
    const handlePromoteToOwner = async () => {
        try {
            const userId = targetUserId;
            const res = await commApi.promoteToOwner(commName, userId);
            setError(res.message || null);
            console.log(res.message);
            await refreshCommunity();
            // Close mod popup after a brief delay
            setTimeout(() => {
                toggleModPopup();
            }, 500);
        } catch (err) {
            console.error("Failed to promote user to owner:", err);
            setError("Failed to promote user to owner.");
        }
    };

    // --- DEMOTE OWNER ---
    const handleDemoteOwner = async () => {
        try {
            const userId = targetUserId;
            const res = await commApi.demoteOwner(commName, userId);
            setError(res.message || null);
            console.log(res.message);
            await refreshCommunity();
            // Close mod popup after a brief delay
            setTimeout(() => {
                toggleModPopup();
            }, 500);
        } catch (err) {
            console.error("Failed to demote owner:", err);
            setError("Failed to demote owner.");
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

    function isVideo(url: string) {
        if (!url) return false;
        const ext = url.split('.').pop()?.toLowerCase();
        return ["mp4", "mov", "avi", "wmv", "flv", "mkv"].includes(ext || "");
    }

    return (
        <main className={styles.main}>
            <div className={styles.background}>
                <div className={styles.navBox} style={{ gridArea: "NavBar" }}>
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
                    <div className={styles.horizontalLine}></div>
                    {/* Display owner and modlist. Only display owner once if already a mod */}
                    <div className={styles.ModeratorsBox}>
                        <div className={styles.RulesTitle}>Owners</div>
                        <div className={styles.ModeratorsList}>
                            {community?.ownerList.map((owner) => (
                                <div key={owner.id} className={styles.ModeratorItem}>
                                    <Link href={`/profile/${owner.id}`} className={styles.ModeratorLink}>
                                        <div className={styles.ModeratorContent}>
                                            <Image
                                                src={owner.photoURL || "/default-profile.png"}
                                                alt="Owner Profile Picture"
                                                width={30}
                                                height={30}
                                                className={styles.ModeratorAvatar}
                                            />
                                            <span className={styles.ModeratorName}>{owner.username || "Unknown User"}</span>
                                            {/* <span className={styles.ModeratorRole}>(Owner)</span> */}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <div className={styles.RulesTitle}>Moderators</div>
                        <div className={styles.ModeratorsList}>
                            {community?.modList.map((mod) => (
                                !community?.ownerList.some(owner => owner.id === mod.id) && (
                                    <div key={mod.id} className={styles.ModeratorItem}>
                                        <Link href={`/profile/${mod.id}`} className={styles.ModeratorLink}>
                                            <div className={styles.ModeratorContent}>
                                                <Image
                                                    src={mod.photoURL || "/default-profile.png"}
                                                    alt="Moderator Profile Picture"
                                                    width={30}
                                                    height={30}
                                                    className={styles.ModeratorAvatar}
                                                />
                                                <span className={styles.ModeratorName}>{mod.username || "Unknown User"}</span>
                                                {/* <span className={styles.ModeratorRole}>(Moderator)</span> */}
                                            </div>
                                        </Link>
                                    </div>
                                )
                            ))}
                        </div>
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
                                    minLength={1}
                                    maxLength={100}
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
                                    minLength={1}
                                    maxLength={1000}
                                    onChange={(e) => setContents(e.target.value)}
                                    className={`${styles.popupText} ${styles.inputField}`}
                                    style={{ height: "120px" }}
                                />

                                {/* Message */}
                                {error && <p className={styles.errorText}>{error}</p>}

                                {/* Submit Button */}
                                <button
                                    className={`${styles.saveBtn} ${styles.popupText}`}
                                    onClick={async () => {
                                        await handleAddPost();
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
                                            width={100}
                                            height={100}
                                            className={styles.serverIcon}
                                        />
                                    </button>
                                ) : (
                                    // Otherwise, just display the icon
                                    <Image
                                        src={community.icon}
                                        alt="Community Icon"
                                        width={100}
                                        height={100}
                                        className={styles.serverIcon}
                                    />
                                )}
                            </div>
                            <div className={styles.titleText}>
                                {commName}
                                {/* Button that toggles edit forum popup */}
                                {(isMod || isOwner) && (
                                    <button className={styles.editForumButton} onClick={() => setEditPopup(true)}>
                                        <Image
                                            src={editButton}
                                            height={40}
                                            width={40}
                                            alt="edit"
                                        />
                                    </button>
                                )}
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
                                {/* If user is owner, display community settings button */}
                                {isOwner && (
                                    <button className={styles.editCommunityButton} onClick={toggleEditCommPopup}>
                                        <Image
                                            src={cogwheel}
                                            height={40}
                                            width={40}
                                            alt="community settings"
                                        />
                                    </button>
                                )}
                                {/* If user is mod/owner, display button to show blacklist */}
                                {(isMod || isOwner) && (
                                    <button className={styles.blacklistButton} onClick={toggleBlacklistPopup}>
                                        <Image
                                            src={listIcon}
                                            height={40}
                                            width={40}
                                            alt="blacklist"
                                        />
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

                                // Check if the post's author is a mod or owner, and a member of the community
                                const authorIsMod = community.modList.some(m => m.id === post.authorId);
                                const authorIsOwner = community.ownerList.some(o => o.id === post.authorId);
                                const authorIsMember = community.userList.some(member => member.id === post.authorId);

                                return (
                                    <div key={post.id} className={styles.postCard}>
                                        {/* ---- Post metadata ---- */}
                                        {/* Post author */}
                                        <div className={styles.postHeading}>
                                            <Link className={styles.user} href={`/profile/${post.authorId}`}>
                                                <Image src={post.authorPFP} alt={`${post.authorUsername}'s profile picture`} width={20} height={20} className={styles.userProfile} />
                                                <div className={styles.authorText}>
                                                    {post.authorUsername} {authorIsOwner
                                                        ? " [OWNER]"
                                                        : authorIsMod
                                                            ? " [MOD]"
                                                            : authorIsMember
                                                                ? " [MEMBER]"
                                                                : ""}
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
                                                    className={`${styles.saveBtn}`}
                                                >
                                                    Save
                                                </button>

                                                {/* Cancel button */}
                                                <button
                                                    onClick={cancelEditing}
                                                    className={`${styles.cancelButton}`}
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
                                                            {isVideo(post.media) ? (
                                                                <video controls>
                                                                    <source src={post.media} />
                                                                </video>
                                                            ) : (
                                                                <Image src={post.media} alt="Post Media" width={350} height={350} />
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

                                                    <Link href={`/community/${commName}/${forumSlug}/${post.id}`} className={styles.commentsBox}>
                                                        <div className={styles.commentsBox}>
                                                            <div className={styles.commentIcon} style={{ gridArea: "icon" }}>
                                                                {/* <Link href={`/community/${commName}/${forumSlug}/${post.id}`}> */}
                                                                <Image
                                                                    src={commentIcon}
                                                                    width={50}
                                                                    height={50}
                                                                    alt="commentIcon"
                                                                    style={{ cursor: "pointer" }}
                                                                />
                                                                {/* </Link> */}
                                                            </div>
                                                            <div className={styles.ratioScore} style={{ gridArea: "ratio" }}>
                                                                {/* <Link href={`/community/${commName}/${forumSlug}/${post.id}`}> */}
                                                                {post.replyCount}
                                                                {/* </Link> */}
                                                            </div>
                                                        </div>
                                                    </Link>
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
                                                                height={20}
                                                                width={20}
                                                                alt="edit"
                                                            />
                                                        </button>

                                                        {/* Moderator tools button; display if owner or mod */}
                                                        {/* Do not show if: */}
                                                        {/* User is a mod, but post user is an owner/mod */}
                                                        {/* Post user is not a member */}
                                                        {/* Post user is the user */}
                                                        {((isMod && (!authorIsMod && !authorIsOwner)) || isOwner) && authorIsMember && !isAuthor ? (
                                                            <button
                                                                className={styles.postModToolsButton}
                                                                onClick={() => {
                                                                    toggleModPopup();
                                                                    setTargetUserId(post.authorId);
                                                                    setTargetUsername(post.authorUsername);
                                                                }}
                                                            >
                                                                <Image
                                                                    src={shield}
                                                                    height={20}
                                                                    width={20}
                                                                    alt="moderator tools"
                                                                />
                                                            </button>
                                                        ) : ""}

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
                                                                    height={20}
                                                                    width={20}
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
                                                                    height={20}
                                                                    width={20}
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

                            {message && <p className={styles.errorText}>{message}</p>}
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

                                {message && <p className={styles.errorText}>{message}</p>}
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
            {/* Delete forum confirmation popup */}
            {confirmDeleteForum && (
                <div className={styles.popupOverlay} onClick={toggleConfirmDeleteForum}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Confirm Delete Forum</h2>
                        <p className={styles.popupText}>Are you sure you want to delete forum &quot;{deleteForumName}&quot;? <br /> This action cannot be undone.</p>
                        {error && <p className={styles.errorText}>{error}</p>}
                        <button onClick={toggleConfirmDeleteForum} className={styles.cancelButton}>Cancel</button>
                        <button onClick={() => { handleDeleteForum(deleteForumId) }} className={styles.deleteButtonPopup}>Delete</button>
                    </div>
                </div>
            )}
            {/* Delete group confirmation popup */}
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
            {/* Delete post confirmation popup */}
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
                                <Image src={iconPreview} alt="Preview Icon" width={80} height={80} className="w-20 h-20 rounded-full object-cover border" />
                            </div>
                        )}

                        {/* File upload input and buttons to change the icon or close the popup */}
                        <input type="file" accept="image/*" className={`${styles.inputField} ${styles.popupText}`} onChange={handleIconChange} />
                        {error && <p className={styles.errorText}>{error}</p>}
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
                        {error && <p className={styles.errorText}>{error}</p>}
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
                        <ul className={styles.blacklistList}>
                            {community.blacklist.length === 0 ? (
                                <p className={styles.blacklistEmpty}>The blacklist is empty.</p>
                            ) : (
                                community.blacklist.map((bannedUser) => (
                                    <li key={bannedUser.id} className={styles.blacklistItem}>
                                        {/* User's profile picture */}
                                        <Image src={bannedUser.photoURL} alt={bannedUser.username} width={40} height={40} />
                                        {/* Link to their profile */}
                                        <Link href={`/profile/${bannedUser.id}`} className={styles.blacklistName}>
                                            {bannedUser.username}
                                        </Link>
                                        {/* Button to unban the user */}
                                        <button className={`${styles.unbanButton}`} onClick={() => {
                                            handleUnbanUser(bannedUser.id);
                                        }}>
                                            Unban User
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                        {error && <p className={styles.errorText}>{error}</p>}
                        <button className={`${styles.popupText} ${styles.closeBtn}`} onClick={toggleBlacklistPopup}>
                            Close
                        </button>
                    </div>
                </div>
            )}
            {/* --- EDIT COMMUNITY POPUP --- */}
            {editCommPopup && (
                <div className={styles.popupOverlay} onClick={toggleEditCommPopup}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Edit Community</h2>
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
                            <label className={styles.popupText}>
                                New Name: <br />
                                <input
                                    type="text"
                                    name="newName"
                                    defaultValue={community.name}
                                    className={`${styles.popupText} ${styles.inputField}`}
                                    maxLength={24}
                                    pattern="^[a-zA-Z0-9_-]+$"
                                    title="24 characters max. Name can only contain letters, numbers, underscores, and hyphens."
                                />
                            </label>
                            <br /><br />
                            <label className={styles.popupText}>
                                Description: <br />
                                <textarea
                                    name="description"
                                    className={`${styles.popupText} ${styles.inputField}`}
                                    defaultValue={community.description}
                                    maxLength={100}
                                    title="100 characters max."
                                />
                            </label>
                            <br /><br />
                            <label className={styles.popupText}>
                                Rules: <br />
                                <textarea
                                    name="rules"
                                    className={`${styles.popupText} ${styles.inputField}`}
                                    defaultValue={community.rules}
                                    maxLength={200}
                                    title="200 characters max."
                                />
                            </label>
                            <br /><br />
                            <label className={styles.popupText}>
                                Public:{" "}
                                <input
                                    type="checkbox"
                                    name="isPublic"
                                    defaultChecked={community.public}
                                />
                            </label>
                            <br /><br />
                            {error && <p className={styles.errorText}>{error}</p>}
                            <br />
                            <button type="submit" className={`${styles.popupText} ${styles.saveBtn}`}>Save Changes</button>
                        </form>
                        <button className={` ${styles.closeBtn} ${styles.popupText}`} onClick={toggleEditCommPopup}>
                            Close
                        </button>

                        {isOwner && (
                            <div className={` ${styles.closeBtn} ${styles.popupText}`}>
                                <button onClick={() => handleDeleteComm(community.name)}>
                                    DELETE COMMUNITY
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* --- ALERT POPUP --- */}
            {alertOpen && (
                <div className={styles.popupOverlay} onClick={() => { toggleAlertPopup(); setError(null); }}>
                    <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Alert</h2>
                        {error && <p className={styles.errorText}>{error}</p>}
                        <button className={`${styles.popupText} ${styles.closeBtn}`} onClick={() => { toggleAlertPopup(); setError(null); }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
            {/* --- MODERATOR TOOLS POPUP --- */}
            {modPopup && (
                <div className={styles.popupOverlay} onClick={() => { toggleModPopup(); setError(null); }}>
                    <div className={styles.popupBoxModerator} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.popupText}>Moderator Tools</h2>
                        <p className={styles.popupText}>Target User: {targetUsername}</p>
                        {/* Button to kick user */}
                        <button className={`${styles.popupText} ${styles.kickUserButton}`} onClick={handleKickUser}>
                            Kick User
                        </button>
                        {/* Button to ban user */}
                        <button className={`${styles.popupText} ${styles.banUserButton}`} onClick={handleBanUser}>
                            Ban User
                        </button>
                        {/* Buttons if owner only: */}
                        {/* Button to promote and demote to/from moderator */}
                        {isOwner && !community.ownerList.some(o => o.id === targetUserId) && (
                            <>
                                {!community.modList.some(m => m.id === targetUserId) ? (
                                    <button className={`${styles.popupText} ${styles.promoteModButton}`} onClick={handlePromoteToMod}>
                                        Promote to Moderator
                                    </button>
                                ) : (
                                    <button className={`${styles.popupText} ${styles.demoteModButton}`} onClick={handleDemoteMod}>
                                        Demote from Moderator
                                    </button>
                                )}
                            </>
                        )}
                        {/* Button to promote/demote to/from owner */}
                        {isOwner && (
                            <>
                                {!community.ownerList.some(o => o.id === targetUserId) ? (
                                    <button className={`${styles.popupText} ${styles.promoteOwnerButton}`} onClick={handlePromoteToOwner}>
                                        Promote to Owner
                                    </button>
                                ) : (
                                    targetUserId !== user?.uid ? (
                                        <button className={`${styles.popupText} ${styles.demoteOwnerButton}`} onClick={handleDemoteOwner}>
                                            Demote from Owner
                                        </button>
                                    ) : null
                                )}
                            </>
                        )}
                        {error && <p className={styles.errorText}>{error}</p>}
                        <button className={`${styles.popupText} ${styles.closeBtn}`} onClick={() => { toggleModPopup(); setError(null); }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}