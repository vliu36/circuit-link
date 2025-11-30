"use client";
import React from "react";
import Styles from "./aboutus.module.css";
import Link from "next/link";

export default function AboutUs() {
    
    return (
        <div className = {Styles.background}>
            <div className = {Styles.pageDoc}>
                <h1 className = {Styles.heading1}>About Us</h1>

                <section>
                    <p className = {Styles.paragraph}>
                    Hello, we are Blue Circuit, the creators of Circuit Link.
                    We have built this platform with a clear code of conduct and community etiquette that all members.
                    are encouraged to follow, ensuring meaningful interactions.
                    </p>
                    <p className = {Styles.paragraph}>
                    Our goal is simple: enjoy the site,
                    connect with others, and feel free to be yourself.
                    </p>
                </section>

                <section>
                    <p className = {Styles.paragraph}>
                        At Blue-Circuit, we believe that shared interests spark meaningful connections. That is why we built a platform 
                    that blends the very best of Discord and Reddit -- a dynamic space where people from all walks of life can come together to discuss,
                    discover, and enjoy the things they love.
                    </p>
                    <p className = {Styles.paragraph}>
                    Whether it is gaming, food, fitness, crafts, or countless other passions, our community
                    is designed to make conversations engaging, fun, and authentic. We set out to create somethingdifferent from the traditional apps
                    that you may already know -- a fresh experience that feels both familiar and exciting, while staying true to our mission of building
                    something useful and meaningful for many.
                    </p>
                    <p className = {Styles.paragraph}>
                    Our team is driven by vision, dedication, and a strong commitment to seeing ideas through 
                    from start to finish. We value those hardworking individuals who share our belief that innovation comes from passion and persistance. Together,
                    we are shaping a platform that celebrates curiosity, creativity, and connection.
                    </p>
                    <p className = {Styles.paragraph}>
                    Join us here at Blue-Circuit -- where interests turn
                    into conversations and conversations become into closely knitted communities.
                    </p>
                </section>
                
                <Link className = {Styles.returnButton} href = ".." replace>
                    <span className = {Styles.returnButtonText}>Return</span>
                </Link>
            </div>
        </div>
    );
}