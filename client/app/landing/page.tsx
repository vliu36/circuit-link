
import Styles from './landingPage.module.css';
import { logout } from "./landing.ts";
import SearchBar from "../searchbar/searchbar.tsx";
import SearchResults from "../searchbar/searchResult.tsx";
import { cookies } from "next/headers";

export default async function Landing() {
    const cookieStore = await cookies();

    const res = await fetch("http://localhost:2400/api/users/me", {
        method: "GET",
        headers: {
        // Pass the cookie manually for SSR
        Cookie: cookieStore.toString(),
        },
        cache: "no-store", // prevents caching SSR results per user
    });
    if (!res.ok) {
        return <p>Not logged in</p>;
    }
    const { user } = await res.json();

    return (
        <div style={{ backgroundColor: "rgb(7, 17,45)", minHeight: "100vh" }}>
        <div className = {Styles.Verticalline}></div>
        <div className = {Styles.VerticallineOne}></div>
        <div className = {Styles.VerticallineTwo}></div>
        
        <div>
            <h1 className = {Styles.textBox}>
                Welcome to Circuit-Link,
            </h1>
            <h2 className = {Styles.usernameTextBox}>
                {user?.username}

            </h2>
            <h3>
                <SearchBar />
            </h3>
            <h4> 
                <SearchResults />
            </h4>
        </div>


        <div className={Styles.Buttoncontainer}>
            <button className={Styles.ButtonStyle}>
                <img src="/home.svg" className={Styles.homelogoBox}></img>
                <div className = {Styles.buttonTextAlignment}>Home</div>   
            </button>

            <button className={Styles.ButtonStyle}>
                <img src="/friends.svg" className={Styles.homelogoBox}></img>
                <div className = {Styles.buttonTextAlignment}>Friends</div>
            </button>

            <button className={Styles.ButtonStyle}>
                <img src="/notification.svg" className={Styles.homelogoBox}></img>
                <div className = {Styles.buttonTextAlignment}>Notifications</div>
            </button>
        </div>

        <div className={Styles.Left}></div>
        <div className={Styles.Right}></div>
        <div className={Styles.HorizontallineOne}></div>
        <div className={Styles.Horizontalline}></div>
        <div className = {Styles.logoBox}>
            <img src="/circuitlinklogowback.svg"></img>
        </div>
        
        <img src = "/add.svg" className = {Styles.addIcon}></img>
        
        <div className = {Styles.dropdown}>
            <button className = "dropdownButton"><img src={user.picture || "/profileIcon.svg"} className = {Styles.settingsIcon}></img></button>
            <div className = {Styles.dropdownMenu}>
                {/* <button onClick={() => window.location.href = "http://localhost:3000/profile"}>Profile</button> */}
                <button>Profile</button>
                <button>Settings</button>
                {/* <button onClick={logout}>Log Out</button> */}
                <button>Log Out</button>
            </div>
        </div>
    </div>
    );
}
