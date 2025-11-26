"use client"

import { use, useState } from "react"
import { sendMessage, getMessages } from "@/app/_utils/messaging.ts";

export default function CommunityChat({params}: {params: Promise<{ commName: string }>}) {
    const { commName } = use(params);

    return (
        <div></div>
    )
}
