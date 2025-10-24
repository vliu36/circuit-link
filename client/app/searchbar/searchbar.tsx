"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState, type SVGProps } from "react";
import Styles from "./searchbar.module.css";
import SearchResult from "./searchResult";

const MagnifyingGlassIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
    const [value, setValue] = useState(initialQuery);   //Local state for storage of current input
    const pathname = usePathname(); //Get current path for navigation
    const router = useRouter(); //Next.js router for navigation on the client side (Not sure if this is right)

    const handleSearch = (searchString: string) => {
        setValue(searchString);
        //Create new URLSearchParams for building the query string
        const params = new URLSearchParams();
        if (searchString) params.set("query", searchString);
        router.replace(`${pathname}?${params.toString()}`); //Replace current URl with the new query without eloading the page
    };

    return (
        <div className={Styles.searchbar}>
            <label htmlFor="search" className="sr-only">
                Find your community...
            </label>
            <input 
                className="peer block w-1/2 rounded-md border border-gray-200 py-2 pl-10 pr-2 text-sm outline-2 placeholder:text-gray-300"
                placeholder="Find your community..."
                value={value}
                onChange={(e) => handleSearch(e.target.value)}
                />
            <MagnifyingGlassIcon className="absolute left top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-300 peer-focus:text-gray-300"/>
        </div>
    );
}
