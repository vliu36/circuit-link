"use server"

import Styles from './community.module.css';
import SearchBar from "../_components/searchbar/search.tsx";
// import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthButtons from '../_components/navbar/authbuttons.tsx';
import Image from "next/image";
import NavBar from '../_components/navbar/navbar.tsx';
import { Suspense } from 'react';

export default async function Landing(props: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
    }>;
}) {

    return (

        /* Background */
        <div className = {Styles.background}>

            {/* These are the Left Side Bar*/}
            <div className = {Styles.yourCommunitiesBar}>
                <h1>Your Communities</h1>
                <button className = {Styles.communitiesButtons}>
                    <img src = "plus.svg" className = {Styles.addIcon}></img>
                    <h1 className = {Styles.buttonTextforCommunities}>Add a Community</h1>
                </button>
            </div>

            <div className = {Styles.serverBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>Server Name</h1>
                <div className = {Styles.horizontalLine}></div>
                <div className = {Styles.serverContainer}>
                    <h1>Group</h1>
                    <div className = {Styles.channelText}>Channel 1</div>
                    <div className = {Styles.channelText}>Channel 2</div>
                    <div className = {Styles.channelText}>Channel 3</div>
                </div>
            </div>


            {/* This is the right side bar*/}
            <div className = {Styles.channelInfoBox}>
                <div className = {Styles.channelInfoh1}>Channel Name</div>
                <div className = {Styles.channelInfoh2}>SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP SEND HELP </div>
            </div>
            <div className = {Styles.RulesBar}>
                <div className = {Styles.horizontalLine}></div>
                <div className = {Styles.horizontalLine}></div>
                <h1>Rules</h1>
                <div className = {Styles.usersBar}>
                    <div className = {Styles.horizontalLine}></div>
                    <div className = {Styles.channelInfoh1}>Users</div>
                    <div className = {Styles.UserContainer}>
                        <div className = {Styles.addIcon}></div>
                        <div className = {Styles.userTextAlign}>Example</div>
                    </div>
                </div>
            </div>

            {/* This is our navbar fully implemented */}
            <div className = {Styles.navBox}>
                <NavBar/>
            </div>
            
            {/* This is the middle page, follow the comment's directions*/}
            <div className = {Styles.communnitiesPage}>
                {/* This is the Banner */}
                <div className = {Styles.bannerBox}>
                    {/* This is the banner's background */}
                    <div className = {Styles.banner}></div>
                    {/* Icon and Title Rendering */}
                    <div className = {Styles.topCommunitiesBar}>
                        <div className = {Styles.serverIcon}></div>
                        <div className = {Styles.serverTitle}>serverTitle</div>
                    </div>
                    {/* Literally Just a Horizontal Line */}
                    <div className = {Styles.horizontalBlackLine}></div>
                </div>

                <div className = {Styles.topThreadsBox}>
                    Pinned / Daily Thread / Highlights
                    <div className = {Styles.thredsRowBox}>
                        <div className = {Styles.threadsBox}></div>
                        <div className = {Styles.threadsBox}></div>
                        <div className = {Styles.threadsBox}></div>      
                        <div className = {Styles.threadsBox}></div>   
                        <div className = {Styles.threadsBox}></div>   
                        <div className = {Styles.threadsBox}></div>                     
                    </div>
                </div>
                <div className = {Styles.horizontalBlackLinePosts}></div>


                <div className = {Styles.postBox}>
                    <div className = {Styles.userPost}>
                        <div className = {Styles.UserContainer}>
                            <div className = {Styles.userIcon}></div>
                            <div className = {Styles.userTextAlignPosts}>Example</div>
                        </div>
                    </div>
                    <div className = {Styles.postTitle}>I HATE EVERYTHING</div>
                    <div className = {Styles.postText}>
                        LALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALA
                        LALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALALA
                    </div>
                </div>
                <div className = {Styles.horizontalBlackLinePosts}></div>

                <div className = {Styles.postBox}>
                    <div className = {Styles.userPost}>
                        <div className = {Styles.UserContainer}>
                            <div className = {Styles.userIcon}></div>
                            <div className = {Styles.userTextAlignPosts}>bigEGaming</div>
                        </div>
                    </div>
                    <div className = {Styles.postTitle}>CS 3010</div>
                    <div className = {Styles.postText}>
                       Im going to vent about the death penality.
                    </div>
                </div>
                <div className = {Styles.horizontalBlackLinePosts}></div>
            </div>
        </div>
        
    );
}