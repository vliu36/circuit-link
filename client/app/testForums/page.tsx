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
        <div className = {Styles.background}>
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

            <div className = {Styles.navBox}>
                <NavBar/>
            </div>
            
            <div className = {Styles.communnitiesPage}>
                <button>
                    
                </button>
            </div>
        </div>
        
    );
}