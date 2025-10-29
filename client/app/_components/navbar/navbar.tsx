import Styles from "./navbar.module.css";
import Link from "next/link";     
import Image from "next/image";     
           
export default function NavBar() {

    return (
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
    )
}