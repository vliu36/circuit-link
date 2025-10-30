"use server"

import Styles from './landingPage.module.css';
import SearchBar from "./_components/searchbar/search.tsx";
// import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthButtons from './_components/navbar/authbuttons.tsx';
import Image from "next/image";

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

            <div className = {Styles.resourcesBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>Resources</h1>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/aboutUs.svg" className = {Styles.aboutUsIcon}></img>
                    <h1 className = {Styles.buttonText}>About Circuit Link</h1>
                </button>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/helpbutton.svg" className = {Styles.aboutUsIcon}></img>
                    <h1 className = {Styles.buttonText}>Get Help</h1>
                </button>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/bug.svg" className = {Styles.aboutUsIcon}></img>
                    <h1 className = {Styles.buttonText}>Report A Bug</h1>
                </button>
                <button className ={Styles.resourcesBarButtons}>
                    <img src = "/rules.svg" className = {Styles.aboutUsIcon}></img>
                    <h1 className = {Styles.buttonText}>Circuit Link Rules</h1>
                </button>
            </div>

            <div className = {Styles.topUsersBar}>
                <h1>Top Users</h1>
            </div>

            <div className = {Styles.topCommunitiesBar}>
                <div className = {Styles.horizontalLine}></div>
                <h1>Top Communities</h1>
            </div>

            <div className = {Styles.navBox}>
                <Link href="/">
                    <Image className = {Styles.homeLogo} src="/circuitlinklogowback.svg" width={200} height={50} alt="Circuit Link Logo"/>
                </Link>
                <div className = {Styles.logInInfo}>
                    <Link className = {Styles.logInSignUpButton} href="./signin" replace> Log In </Link>
                    <h1 className = {Styles.orText}> or </h1>
                    <Link className = {Styles.logInSignUpButton} href="./register" replace> Sign Up </Link>
                </div>
            </div>
            <div className = {Styles.searchBarArea}>
                <div className = {Styles.welcomeText}>
                    Welcome to Circuit Link
                </div>
                <div className= {Styles.searchBarAlignment}>
                    <SearchBar/>
                </div>
            </div>
        </div>
        
    );
}