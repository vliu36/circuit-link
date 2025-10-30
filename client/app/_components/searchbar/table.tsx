import Link from "next/link";
import Styles from "./search.module.css";

/** Used to resolve the typing for SearchResult
 * Initially, SearchResult had ({items}: any), this interface gives it a proper type
 */
interface SearchResultProps {
    items?: string[],
}

export default function Table({items}: SearchResultProps) {
    return (
        <ul> 
            {items?.map((item: string) => (
                <li className={Styles.searchResult} key={item}>
                    <Link href={`/community/${item}`}>{item}</Link>
                </li>
            ))}
        </ul>
    );
}