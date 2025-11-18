// This page displays the list of posts within a specific forum of a community.
"use client"

import { useState, useEffect } from "react";
import { useAuth } from "../../../_firebase/context.tsx";
import { use, useRef } from "react";
import Link from "next/link";
import { fetchPostsByForum, createPost, editPost, deletePostById, votePost, editForum, getMediaUrl } from "./forum.ts";
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

export default function ForumPage({
    params,
}: {
    params: Promise<{ commName: string; forumSlug: string }>;
}) {
    const { commName, forumSlug } = use(params);
    const { user } = useAuth();
    const [community, setCommunity] = useState<Community | null>(null);
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

    const toggleEditGroupPopup = () => {
        setEditGroupOpen(!editGroupOpen);
        setError(null);
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

    // Toggle edit forum popup
    const toggleEditPopup = () => {
        setEditPopup(!editPopup);
        setMessage(null);
    }

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

    if (!community) return <div>Community not found.</div>;

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
    const handleVote = async (postId: string, type: "yay" | "nay") => {
        if (!user) return alert("Sign in to vote!");
        try {
            await votePost(postId, type);
            fetchPosts();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading forum...</div>;
    if (!forum) return <div>Forum not found.</div>;

    // Handle edit forum 
    const handleEdit = async (name?: string, description?: string) => {
        try {
            const res = await editForum(forum.id, name, description);
            const oldName = forum.name;
            console.log(res.message);
            setMessage(res.message || null);
            if (res.status === "ok" && name && name !== oldName) {
                setTimeout(() => { }, 3000); // Wait for 3 seconds to let user read the message
                // setEditPopup(false);
                router.push(`/community/${commName}/${res.newSlug}`);
            } else if (res.status === "ok") {
                fetchPosts();
                toggleEditPopup();

            }
        } catch (error) {
            setMessage("An error occurred while editing the forum.");
        }
    }

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setMediaFile(file);
        if (file) setMediaPreview(URL.createObjectURL(file));
    };

    const isMod = community?.modList.some(m => m.id === user?.uid);
    const isOwner = community?.ownerList.some(o => o.id === user?.uid);

    return (
        <main>
            <div className={styles.background}>
                <div className={styles.navBox} style={{ gridArea: "NavBar" }}>
                    <NavBar />
                </div>

                <div className={styles.yourCommunitiesBar} style={{ gridArea: "CommunitiesBar" }}>
                    <h1>Your Communities</h1>
                    <button className={styles.communitiesButtons}>
                        <img src="plus.svg" className={styles.addIcon}></img>
                        <h1 className={styles.buttonTextforCommunities}>Add a Community</h1>
                    </button>
                </div>

                <div className={styles.serverBar} style={{ gridArea: "ServerBar" }}>
                    <div className={styles.horizontalLine}></div>
                    <h1>{commName}</h1>
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
                                        {
                                            (isOwner || isMod) &&
                                            <>
                                                <button className={styles.deleteGroup} onClick={() => handleDeleteGroup(group.id)}>
                                                    Delete Group
                                                </button>
                                                <button className={styles.editGroup} onClick={() => { toggleEditGroupPopup(); setEditGroupId(group.id); }}>
                                                    Edit Group
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
                                                        <button className={styles.deleteChannel} onClick={() => handleDeleteForum(forum.id)}>
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
                    </div>


                    <div className={styles.createBox}>
                        {/* --- Create New Post Section --- */}
                        {user ? (
                            <div className={styles.createSection}>
                                <h2>Create New Post</h2>
                                <input
                                    placeholder="Post Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={styles.input}
                                />
                                <div className={styles.input}>
                                    {mediaPreview && (
                                        <img src={mediaPreview} alt="Media preview" className={styles.mediaPreview} />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        ref={fileInputRef}
                                        onChange={handleMediaChange}
                                        className={styles.input}
                                    />
                                </div>
                                <textarea
                                    placeholder="Post Contents"
                                    value={contents}
                                    onChange={(e) => setContents(e.target.value)}
                                    className={styles.textarea}
                                />
                                <button className={styles.primaryButton} onClick={handleAddPost}>
                                    Add Post
                                </button>
                            </div>
                        ) : (
                            <p>Please sign in to create posts.</p>
                        )}

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
                                                <div className={styles.userProfile}></div>
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
                                                    <div className={styles.mediaPreview}>
                                                        {post.media.endsWith(".mp4") ? (
                                                            <video controls>
                                                                <source src={post.media} type="video/mp4" />
                                                            </video>
                                                        ) : (
                                                            <Image src={post.media} alt="Post Media" width={200} height={100} />
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

                                                        {/* Edit and delete buttons */}


                                                        {/* Edit button */}
                                                        {isAuthor && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingPostId(post.id);
                                                                    setEditTitle(post.title);
                                                                    setEditContents(post.contents);
                                                                }}
                                                                className={`${styles.button} ${styles.editButton}`}
                                                            >
                                                                Edit
                                                            </button>
                                                        )}
                                                        {/* Delete button */}
                                                        {(isAuthor || isMod || isOwner) && (
                                                            <button
                                                                onClick={() => handleDeletePost(post.id, commName)}
                                                                className={`${styles.button} ${styles.deleteButton}`}
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div style={{ marginLeft: "2vw" }}></div>
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
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
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
        </main>
    );
}