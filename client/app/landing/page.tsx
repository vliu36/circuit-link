"use client";
import React from "react";
import Styles from './landingPage.module.css';

export default function Landing() {
    return (
        <div style={{ backgroundColor: "rgb(7, 17,45)", minHeight: "100vh" }}>
        <div className = {Styles.Verticalline}></div>
        <div className = {Styles.VerticallineOne}></div>
        <div className = {Styles.VerticallineTwo}></div>
        
        <h1 className = {Styles.textBox}>
            Welcome to Circuit-Link,
        </h1>
        <h2 className = {Styles.usernameTextBox}>
            User
        </h2>

        <div className={Styles.Searchbar}>
            <input type="text" placeholder="Search..." />
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

            <button className={Styles.ButtonStyle}>
                <img src="/news.svg" className={Styles.homelogoBox}></img>
                <div className = {Styles.buttonTextAlignment}>Site News</div>
            </button>

            <button className={Styles.ButtonStyle}>
                <img src="/logout.svg" className={Styles.homelogoBox}></img>
                <div className = {Styles.buttonTextAlignment}>Log Out</div>
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
    </div>
    );
}