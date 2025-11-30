// Used in @app/community/[commName]/[forumSlug]/page.tsx
export type Post = {
    id: string;
    title: string;
    contents: string;
    media: string | null;
    authorUsername: string;
    authorId: string;
    authorPFP: string;
    yayScore: number;
    replyCount: number;
    yayList: string[];
    nayList: string[];
    timePosted: string;
    edited: boolean;
};


export interface User {
    id: string;
    username: string;
    email: string;
    photoURL: string;
}

export interface Forum {
    id: string;
    name: string;
    slug: string;
    description: string;
    parentGroup: string; // Originally DocumentReference, but fetched to string ID here
}

export interface Group {
    id: string;
    name: string;
    forumsInGroup: Forum[];
}

export interface Community {
    groups: Group[];
    id: string;
    name: string;
    description: string;
    groupsInCommunity: Group[];
    userList: User[];
    ownerList: User[];
    modList: User[];
    blacklist: User[];
    public: boolean;
    icon: string;
    banner: string;
    rules: string;
}

// Used in @app/profile/[uid]/dms/page.tsx and @app/community/[commName]/chat/page.tsx
export interface Message {
    authorId: string;
    authorName: string;
    authorIcon: string;
    contents: string;
    media: string | null;
    timestamp: string;
}