"use client"

import React, { use } from "react";
import Styles from './community.module.css';

export default function CommunityPage({
  params,
}: {
  params: Promise<{ commName: string }>
}) {
  const { commName } = use(params)
 
  return (
    <div>
      <title>Welcome to the {commName} page!</title>
      <p>This page is a work in progress, please come back later!</p>
    </div>
  )
}
