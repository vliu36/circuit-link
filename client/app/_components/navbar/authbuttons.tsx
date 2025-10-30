
import { User } from "firebase/auth";
import Styles from "./navbar.module.css";
import Link from "next/link";
import { logout } from "../../landing.ts";

export default function AuthButtons({ user }: { user: User | null}) {
    console.log(user);
    
    return (
        <div>
            {user ? (
                <div className = {Styles.logInInfo}>
                    <Link className = {Styles.logInSignUpButton} href="./signin" replace> Log In </Link>
                    <h1 className = {Styles.orText}> or </h1>
                    <Link className = {Styles.logInSignUpButton} href="./register" replace> Sign Up </Link>
                </div>
            ) : (
                <div className = {Styles.logInInfo}>
                    <button>
                        <img src = "./notifBell.svg" className = {Styles.notificationButton}></img>
                    </button>
                <div className = {Styles.dropdown}>
                    <button><img src = {"/circleUser.svg"} className = {Styles.settingsIcon} alt="User profile"></img></button>
                    <div className = {Styles.dropdownMenu}>
                        <button onClick={() => window.location.href = "http://localhost:3000/profile"}>Profile</button>
                        <button>Settings</button>
                        <button onClick={logout}>Log Out</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
