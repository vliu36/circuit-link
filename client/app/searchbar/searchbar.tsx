"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import type { SVGProps } from "react";
import Styles from "./searchbar.module.css";
import SearchResult from "./searchResult";

const MagnifyingGlassIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default function SearchBar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    let searchList: string[] = [];

    const handleSearch = async (searchString: string) => {
        const params = new URLSearchParams(searchParams);
        if (searchString) {
            params.set("query", searchString);
        }
        else {
            params.delete("query");
        }
        replace(`${pathname}?${params.toString()}`);
        try {

            if (params.get("query")) {
                const arg = params.get("query")?.toString();
                const res = await fetch(`http://localhost:2400/api/comm/search/${arg}`, {     
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = res.json().then((result) => {
                    const tempArr = result.message;
                    for (var i = 0; i < tempArr.length; i++) {
                        searchList.push(tempArr[i].name);
                    }
                });
            }
        }
        catch (err) {
            console.log(err);
        }
    };

    return (
        <div className={Styles.searchbar}>
            <label htmlFor="search" className="sr-only">
                Find your community...
            </label>
            <input 
                className="peer block w-1/2 rounded-md border border-gray-200 py-[9px]-pl-10 text-sm outline-2 placeholder:text-gray-300"
                placeholder="       Find your community..."
                defaultValue={searchParams.get("query")?.toString()}
                onChange={(e) => {
                    handleSearch(e.target.value);
                    console.log(searchList);
                }}
            />
            <SearchResult items={searchList}/>
            <MagnifyingGlassIcon className="absolute left top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-300 peer-focus:text-gray-300"/>
        </div>
    );
}