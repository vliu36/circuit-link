"use client";
import React, {useEffect, useState} from "react";
import Styles from './landingPage.module.css';
import { words } from "./searchableData.js"; //Word is a seperate string array I made, its only temporary
import { useAuth } from "../context.tsx";

//I am stil struggling to make our database a string of arrays to replace word with
//Send help
//This is the equivilant of being kidnnapped, stored in a basement, being tortured, and then they letting you when you are no use to them. ~Stephan A Smith


export default function Landing() {
    const { user, userData, loading } = useAuth(); 
    
    const[userInfo, setUserInfo] = useState([]);
    const [input, setInput] = useState("");
    useEffect(()=>{
        const getData = async() => {
            const response = await fetch(`http://localhost:2400/api/comm/search/${input}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            });
            console.log('response from API: ', response);
        }
        getData();
    },[input]);

    const goToPage = (path: string) => {
        window.location.href = path;
    };

    const [activeSearch, setActiveSearch] = useState<string[]>([]);
    
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);
        if (value === '') {
            setActiveSearch([]);
            return false;
        }
        setActiveSearch(words.filter(w => w.toLowerCase().includes(value.toLowerCase())));

    };
    console.log(input);

    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.currentTarget.value.trim();
            goToPage("/"+input);
        }
    };

    return (
        <div style={{ backgroundColor: "rgb(7, 17,45)", minHeight: "100vh" }}>
        <div className = {Styles.Verticalline}></div>
        <div className = {Styles.VerticallineOne}></div>
        <div className = {Styles.VerticallineTwo}></div>
        
        <h1 className = {Styles.textBox}>
            Welcome to Circuit-Link,
        </h1>
        <h2 className = {Styles.usernameTextBox}>
            {user?.displayName}
        </h2>

        <form className={Styles.Searchbar} onSubmit={e => e.preventDefault()}>
        <input type="text" placeholder="Search..." onKeyDown={handleKeyDown} onChange={(e) => handleSearch(e)}/>
            {activeSearch.length > 0 && (<div className={Styles.searchOptions}>{
                activeSearch.map((s, i) => (
                    <a key={i} href={`/${encodeURIComponent(s)}`}>
                        {s}
                    </a>
                ))}
            </div>
        )}
        </form>

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
            <button className = "dropdownButton"><img src={user?.photoURL || "/profileIcon.svg"} className = {Styles.settingsIcon}></img></button>
            <div className = {Styles.dropdownMenu}>
                <button onClick={() => window.location.href = "http://localhost:3000/profile"}>Profile</button>
                <button>Settings</button>
                <button>Log Out</button>
            </div>
        </div>
    </div>
    );
}