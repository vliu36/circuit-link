"use client";
import React from "react";

export default function Landing() {
    return (
        <div style={{ backgroundColor: "rgb(7, 17,45)", minHeight: "100vh" }}>
            <style>{`
            .Verticalline {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 8px;
                background-color: lightblue;
                z-index: 0;
            }
            .Horizontalline {
            position: relative;
            margin-top: 20px;
            margin-left: -10px;
            width: 325px;
            height: 8px;
            background-color: lightblue;
            z-index: 10;
            }
            .Left {
            left: 25%;
            }
            .Right {
            right: 25%;
            }
            .Searchbar {
            text-align: center;
            margin-top: 100px;
            }
            .Searchbar input {
            background-color: black;
            color: cyan;
            border: 3px solid lightblue;
            border-radius: 4px;
            font-size: 12px;
            width: 500px;
            }
            .Searchbar input::placeholder {
            color: cyan;
            }
            .Buttoncontainer {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            margin-top: -450px;
            margin-left: 50px;
            }
            .Button {
            position: relative;
            width: 200px;
            height: 30px;
            border: 4px;
            color: gray;
            text-align: center;
            font-size: 12px;
            transition-duration: 0.5s;
            cursor: pointer;
            }
            .Button1, .Button2, .Button3, .Button4, .Button5 {
            background-color: lightskyblue;
            color: blue;
            border: 2px solid;
            }
            .Button1:hover, .Button2:hover, .Button3:hover, .Button4:hover, .Button5:hover {
            background-color: blue;
            color: lightblue;
            }
        `}</style>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <h1 style={{ color: "lightblue", textAlign: "center" }}>
            Welcome to Circuit-Link,
        </h1>
        <h2 style={{ color: "lightblue", textAlign: "center"}}>
            User
        </h2>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />

        <div className="Searchbar">
            <input type="text" placeholder="Search..." />
        </div>

        <div className="Buttoncontainer">
            <button className="Button Button1">Home</button>
            <button className="Button Button2">Friends</button>
            <button className="Button Button3">Notifications</button>
            <button className="Button Button4">Site News</button>
            <button className="Button Button5">Log Out</button>
        </div>

        <div className="Verticalline Left"></div>
        <div className="Verticalline Right"></div>
        <div className="Horizontalline"></div>
    </div>
    );
}