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
      <h1 className={Styles.header}>Welcome to the {commName} community!</h1>
      <p>This page is a work in progress, please come back later!</p>
    </div>
  )
}
