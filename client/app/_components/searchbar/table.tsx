import Link from "next/link";
import Styles from "./search.module.css";

/** Used to resolve the typing for SearchResult
 * Initially, SearchResult had ({items}: any), this interface gives it a proper type
 */
interface SearchResultProps {
    items?: string[],
}

export default function Table({ items }: SearchResultProps) {
    return (
        <ul>
            {items?.map((item: string, index: number) => (
                <li className={Styles.searchResult} key={item}>
                    <div className={Styles.resultBox}>
                        <div className={Styles.resultText}>
                            <Link href={`/community/${item}`}>{item}</Link>
                        </div>

                        {/* Only show the line if it's NOT the last item */}
                        {index !== items.length - 1 && (
                            <div className={Styles.line}></div>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}