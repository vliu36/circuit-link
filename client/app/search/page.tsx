import SearchBar from "../searchbar/searchbar";
import SearchResult from "../searchbar/searchResult";

export default async function SearchPage({ searchParams }: { searchParams: { query?: string } }) {
    const query = searchParams.query || ""; //Extract the query from the URL and default to empty string if none
    let results: string[] = []; //Initialize an empty array for search results

    //Only fetch results IF there is a query
    if (query) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comm/search/${query}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            // Prevent caching so the search always updates
            cache: "no-store",
        });

        //Throw error if server gives a non-ok status
        if (!res.ok) {
            throw new Error(`Server returnd ${res.status}`);
        }

        //Parse JSON response and extract the community names
        const data = await res.json();
        results = data.message.map((item: any) => item.name);
    }

    return (
        <div style={{ position: "relative" }}>
            <SearchBar initialQuery={query} />
            {/*If any results from the server exist then render them below the search bar.
            This stupid thing is taking me hours to figure out man, please help.*/}
            {results.length > 0 && <SearchResult items={results} />}
        </div>
    );
}