//This page appears when the user is not registered
"use server"

import Styles from './landingPage.module.css';
import SearchBar from "../_components/searchbar/search.tsx";
import Link from "next/link";
import AuthButtons from '../_components/navbar/authbuttons.tsx';
import NavBar from '../_components/navbar/navbar.tsx';
import Image from "next/image";
import SearchComponent from './search-component.tsx';
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
                    <Image src = "plus.svg" alt = "add" className = {Styles.addIcon} width={5} height={5}></Image>
                    <h1 className = {Styles.buttonTextforCommunities}>Add a Community</h1>
                </button>
            </div>

            <div className = {Styles.resourcesBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>Resources</h1>
                <Link className ={Styles.resourcesBarButtons} href = "./aboutus" replace>
                    <Image src = "/aboutUs.svg" alt = "about" className = {Styles.aboutUsIcon} width={5} height={5}></Image>
                    <h1 className = {Styles.buttonText}>About Circuit Link</h1>
                </Link>
                <Link className ={Styles.resourcesBarButtons} href = "./help" replace>
                    <Image src = "/helpbutton.svg" alt = "help" className = {Styles.aboutUsIcon} width={5} height={5}></Image>
                    <h1 className = {Styles.buttonText}>Get Help</h1>
                </Link>
                <Link className ={Styles.resourcesBarButtons} href = "./bugreports" replace>
                    <Image src = "/bug.svg" alt = "bug" className = {Styles.aboutUsIcon} width={5} height={5}></Image>
                    <h1 className = {Styles.buttonText}>Report A Bug</h1>
                </Link>
                <Link className ={Styles.resourcesBarButtons} href = "./siterules" replace>
                    <Image src = "/rules.svg" alt = "rules" className = {Styles.aboutUsIcon} width={5} height={5}></Image>
                    <h1 className = {Styles.buttonText}>Circuit Link Rules</h1>
                </Link>
            </div>

            <div className = {Styles.topUsersBar}>
                <h1>Top Users</h1>
            </div>

            <div className = {Styles.topCommunitiesBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>Top Communities</h1>
            </div>

            <NavBar/>
            {/*<div className = {Styles.navBox}>
                <Link href="/" replace>
                    <Image className = {Styles.homeLogo} src="/circuitlinklogowback.svg" width={200} height={50} alt="Circuit Link Logo"/>
                </Link>
                <div className = {Styles.logInInfo}>
                    <Link className = {Styles.logInSignUpButton} href="./signin" replace> Log In </Link>
                    <h1 className = {Styles.orText}> or </h1>
                    <Link className = {Styles.logInSignUpButton} href="./register" replace> Sign Up </Link>
                </div>
            </div>*/}

            <div className = {Styles.searchBarArea}>
                <div className = {Styles.welcomeText}>
                    Welcome to Circuit Link 
                </div>
                <div className= {Styles.searchBarAlignment}>
                <Suspense fallback={<div>Loading...</div>}>
                    <SearchBar/>
                </Suspense>
                </div>
            </div>
        </div>
        
    );
}