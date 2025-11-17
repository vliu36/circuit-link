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
import thumbsDown from '../../../../../public/thumbs-down-regular-full.svg';
import Image from 'next/image'

export default function PostDetail({ params }: { params: Promise<{ commName: string; forumSlug: string; postId: string }> }) {
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

    const MAX_DEPTH = 5;

    useEffect(() => {
        setLoading(true);
        fetchStructure(commName)
            .then((data) => {
                if (data) setCommunity(data);
            })
            .finally(() => setLoading(false));
        }, [commName]);
    
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

    // Handler for deleting posts/replies
    const handleDelete = async (id: string, isReply: boolean) => {
        if (!confirm("Are you sure you want to delete this?")) return;
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

    const isMod = community.modList.some(m => m.id === user?.uid);
    const isOwner = community.ownerList.some(o => o.id === user?.uid);

    // Recursive rendering function for posts and replies
    const renderPostOrReply = (item: Post | Reply, depth = 0) => {
        if (depth >= MAX_DEPTH) return null;
        const isReply = "timeReply" in item;
        const isAuthor = item.authorId === user?.uid;

        return (
            <div 
                key={item.id} 
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
                    <div className = {styles.postBox}>
                        {/* Otherwise, show the post/reply */}
                        {/* Show the author's username and display total yay score */}
                        <div className={styles.meta}>
                            <div className = {styles.userIcon}></div>
                            <div className = {styles.userTextAlignPosts}>
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
                        
                    <div className = {styles.buttonFormat}>
                        <div className={styles.actions}>
                            {/* Yay button; if the current user is in the yay list, show as active (green) */}
                            <button 
                                className={`${styles.voteButton} ${user?.uid && item.yayList.includes(user.uid) ? styles.yayActive : ""}`} 
                                onClick={() => handleVote(item.id, "yay", isReply)}
                            >
                                <div className = {styles.votingIcon}>
                                    <Image
                                        src = {thumbsUp}
                                        width = {40}
                                        height = {40}
                                        alt = "YAYS"
                                    />
                                </div>
                                
                            </button>
                            <div className = {styles.yayscore}>{item.yayScore}</div>
                            {/* Nay button; if the current user is in the nay list, show as active (red) */}
                            <button 
                                className={`${styles.voteButton} ${styles.dislikeButton} ${user?.uid && item.nayList.includes(user.uid) ? styles.nayActive : ""}`} 
                                onClick={() => handleVote(item.id, "nay", isReply)}
                            >
                                <Image
                                    src = {thumbsDown}
                                    width = {40}
                                    height = {40}
                                    alt = "YAYS"
                                />
                            </button>
                            {/* Reply button; disabled (but not hidden) if max depth reached */}
                            
                        </div>
                        
                            {/* Edit and Delete buttons */}
                                <div className = {styles.utilityButtons}>
                                    {/* Edit button; display only if the current user is the author */}
                                    {isAuthor && (
                                        <button 
                                            className={styles.editButton} 
                                            onClick={() => { setEditingId(item.id); setEditContent(item.contents); if (!isReply) setEditTitle(item.title); }}
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {/* Delete button; display only if the current user is the author or a mod/owner */}
                                    {(isAuthor || isMod || isOwner) && (
                                        /* Delete button; display if current user is the author or a mod/owner */
                                        <button 
                                            className={styles.deleteButton} 
                                            onClick={() => handleDelete(item.id, isReply)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            
                            
                    </div>
                </div>

                )}

                <div>
                    <button 
                        className={styles.replyButton} 
                        onClick={() => setActiveReplyTo(activeReplyTo === item.id ? null : item.id)} 
                        disabled={depth >= MAX_DEPTH - 1}
                    >
                        Reply to this post
                    </button>
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
                
                <div className={styles.darkline}></div>

                {/* Render nested replies, if any */}
                {"listOfReplies" in item && item.listOfReplies.length > 0 && (
                    <div style={{ marginLeft: "2vw", width: "96%"}}>
                        {item.listOfReplies.map((r) => renderPostOrReply(r, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (!user) return <div>Sign in to view replies!</div>;
    if (authLoading || !post) return <div>Loading post...</div>;

    return (
        
        <div className = {styles.background}>
            <div className = {styles.yourCommunitiesBar} style={{gridArea: "CommunitiesBar"}}>
                <h1>Your Communities</h1>
                <button className = {styles.communitiesButtons}>
                    <img src = "plus.svg" className = {styles.addIcon}></img>
                    <h1 className = {styles.buttonTextforCommunities}>Add a Community</h1>
                </button>
            </div>

            
            <div className = {styles.serverBar} style={{gridArea: "ServerBar"}}>
                <div className = {styles.horizontalLine}></div>
                <h1>{commName}</h1>
                <div className = {styles.horizontalLine}></div>
                <div className = {styles.serverContainer}>
                    <h1>Group (WIP)</h1>
                    <div className = {styles.channelText}>Channel 1</div>
                    <div className = {styles.channelText}>Channel 2</div>
                    <div className = {styles.channelText}>Channel 3</div>
                </div>
            </div>

            <div className = {styles.channelInfoBox} style={{gridArea: "RightBar"}}>
                <div className = {styles.channelInfoh1}>{commName}</div>
                <div className = {styles.channelInfoh2}>{community?.description}</div>
                
            </div>
            
            <div className = {styles.RulesBar} style={{gridArea: "RightBar"}}>
                <div className = {styles.horizontalLine}></div>
                <div className = {styles.horizontalLine}></div>
                <h1>Rules</h1>

                {/* Displays the list of users in the community */}
                <div className = {styles.usersBar}>
                    <div className = {styles.horizontalLine}></div>
                    <div className = {styles.channelInfoh1}>Users</div>
                    <ul>
                        {community.userList.map((u) => (
                            <li key={u.id} className={styles.UserContainer}>
                                <div className={styles.addIcon}></div>
                                <div className={styles.userTextAlign}>
                                    <Link href={`/profile/${u.id}`}>
                                        {u.username}
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className = {styles.navBox} style={{gridArea: "NavBar"}}>
                <NavBar/>
            </div>
            
            
            

            <div className={styles.postsPage} style={{gridArea: "Center"}}>
                <div className={styles.backDisplay}>
                    <Link href={`/community/${commName}/${forumSlug}`}>
                        Back
                    </Link>
                </div>
                {renderPostOrReply(post)}
                
            </div>
        </div>
    );
}