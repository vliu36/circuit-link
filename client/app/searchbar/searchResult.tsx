import Link from "next/link";
import Styles from "./searchbar.module.css";

export default function SearchResult({items}: any) {
    return (
        <ul> 
            {items?.map((item: any) => (
                <li className={Styles.searchResult} key={item.index}>
                    <Link href={`/community/${item}`}>{item}</Link>
                </li>
            ))}
        </ul>
    );
}