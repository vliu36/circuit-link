// Used in @app/community/[commName]/[forumSlug]/page.tsx
export type Post = {
    id: string;
    title: string;
    contents: string;
    media: string;
    authorUsername: string;
    authorId: string;
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
    // photoUrl: string;
}

export interface Forum {
    id: string;
    name: string;
    slug: string;
    description: string;
}

export interface Group {
    id: string;
    name: string;
    forumsInGroup: Forum[];
}

export interface Community {
    id: string;
    name: string;
    description: string;
    groupsInCommunity: Group[];
    userList: User[];
    ownerList: User[];
    modList: User[];
    public: boolean;
    icon: string;
    banner: string;
}