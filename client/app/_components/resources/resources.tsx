"use client";

import Link from "next/link";
import Image from "next/image";
import Styles from "./resources.module.css";

export default function ResourcesBar() {
    return (
        <div className={Styles.resourcesBar}>
            <h1>Resources</h1>
            <Link className={Styles.resourcesBarButtons} href="./aboutus" replace>
                <Image src="/aboutUsNew.svg" className={Styles.aboutUsIcon} alt="About us icon" width={48} height={70} />
                <h1 className={Styles.buttonText}>About Circuit Link</h1>
            </Link>
            <Link className={Styles.resourcesBarButtons} href="./help" replace>
                <Image src="/helpIconNew.svg" className={Styles.aboutUsIcon} alt="Question mark" width={50} height={70} />
                <h1 className={Styles.buttonText}>Get Help</h1>
            </Link>
            <Link className={Styles.resourcesBarButtons} href="./bugreports" replace>
                <Image src="/reportIconNew.svg" className={Styles.aboutUsIcon} alt="Bug icon" width={50} height={70} />
                <h1 className={Styles.buttonText}>Report A Bug</h1>
            </Link>
            <Link className={Styles.resourcesBarButtons} href="./siterules" replace>
                <Image src="/rulesNew.svg" className={Styles.aboutUsIcon} alt="Book icon" width={50} height={70} />
                <h1 className={Styles.buttonText}>Circuit Link Rules</h1>
            </Link>
        </div>
    );
}