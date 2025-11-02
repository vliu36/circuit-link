import { use } from "react";


export default function ForumPage({
    params,
}: {
    params: Promise<{ commName: string; forumSlug: string, }>
}) {
    const { commName, forumSlug } = use(params);
}