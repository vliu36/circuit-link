import Link from "next/link";
import Styles from "./searchbar.module.css";

export default function SearchResult({items}: any) {
    return (
        <ul>
            {items?.map((item: any) => (
                <li key={item.id}>
                    <Link href={`/community/${item.id}`}>{item}</Link>
                </li>
            ))}
        </ul>
    );
}