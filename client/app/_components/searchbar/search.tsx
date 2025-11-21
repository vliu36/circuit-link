"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState, type SVGProps } from "react";
import Styles from "./search.module.css";
import Table from "./table";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebouncedCallback } from "use-debounce";


export default function SearchBar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [searchList, setSearchList] = useState<string[]>([]);

    const handleSearch = useDebouncedCallback(async (searchString: string) => {
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
                res.json().then((result) => {
                    const tempArr = result.message;
                    const tempRes = tempArr.map((item: { name: string }) => item.name);
                    setSearchList(tempRes);
                });
            } 
            else {
                setSearchList([]);
            }
        }
        catch (err) {
            console.log(err);
        }
    }, 300);

    return (
        <div className={Styles.searchbar}>
            <label htmlFor="search" className="sr-only">
                Find your community...
            </label>
            <input 
                className={Styles.searchBarInputThingIt}
                placeholder="Find your community..."
                defaultValue={searchParams.get("query")?.toString()}
                onChange={(e) => {
                    handleSearch(e.target.value);
                    console.log(searchList);
                }}
            />
            {searchList.length > 0 && (
                <div className={Styles.searchResult}>
                    <Table items={searchList}/>
                </div>)}
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-300 peer-focus:text-gray-300"/>
        </div>
    );
}
