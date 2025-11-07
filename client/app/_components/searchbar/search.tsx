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
                const res = await fetch(`https://api-circuit-link-160321257010.us-west2.run.app/api/comm/search/${arg}`, {     
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
                className="peer block w-1/2 rounded-md border py-2 pl-10 pr-2 text-sm outline-2"
                placeholder="Find your community..."
                defaultValue={searchParams.get("query")?.toString()}
                onChange={(e) => {
                    handleSearch(e.target.value);
                    console.log(searchList);
                }}
            />
            {searchList.length > 0 && (
                 // TODO: Move this to css file
                 //   position: "relative",
                 //   top: "0%",
                 //   left: "0%",
                 //   width: "50%",
                 //   zIndex: 50,
                 //   border: "1px solid #98C5F8",
                 //   borderRadius: "0em 0em 1em 1em",
                 //   maxHeight: "200px",
                 //   overflowY: "auto",
                 //   backgroundColor: "#5B6680"
                <div className={Styles.searchResult}>
                    <Table items={searchList}/>
                </div>)}
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-300 peer-focus:text-gray-300"/>
        </div>
    );
}
