// This page displays the main community page with groups and forums.
"use client"
import React, { use, useState, useEffect } from "react";
import Styles from "./community.module.css";
import { useAuth } from "../../_firebase/context.tsx";
import Link from 'next/link';
import Image from 'next/image';
import * as commApi from "./community";
import { Community } from "../../_types/types.ts";
import { useRouter } from "next/navigation";
import NavBar from '../../_components/navbar/navbar.tsx';
import { getCommunities } from "../../landing.ts"
import { DocumentData } from "@firebase/firestore";

export default function CommunityPage({
  params,
}: {
  params: Promise<{ commName: string }>;
}) {
  const { commName } = use(params);
  const { user } = useAuth();
  const { userData } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCommunities, setUserCommunities] = useState<DocumentData[]>([]);

  // const [groupName, setGroupName] = useState("");
  // const [groupMessage, setGroupMessage] = useState("");
  // const [forumInputs, setForumInputs] = useState<{ [groupId: string]: { name: string; description: string; message: string } }>({});
  // const [targetUserId, setTargetUserId] = useState<string>("");

  const [editOpen, setEditOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  // const [showCreateForum, setShowCreateForum] = useState<{ [key: string]: boolean }>({});
  const [modOptionsOpen, setModOptionsOpen] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [confirmDeleteForum, setConfirmDeleteForum] = useState(false);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);

  // const [iconFile, setIconFile] = useState<File | null>(null);
  // const [iconPreview, setIconPreview] = useState<string | null>(null);
  // const [bannerFile, setBannerFile] = useState<File | null>(null);
  // const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // const [deleteForumId, setDeleteForumId] = useState<string>("");
  // const [deleteForumName, setDeleteForumName] = useState<string>("");
  // const [deleteGroupId, setDeleteGroupId] = useState<string>("");
  // const [deleteGroupName, setDeleteGroupName] = useState<string>("");

  // const [editGroupId, setEditGroupId] = useState<string>("");

  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const toggleCreateGroupPopup = () => {
    setCreateGroupOpen(!createGroupOpen);
    setError(null);
  };


  useEffect(() => {
    if (loading) return;

    async function loadData() {
      if (userData?.communities) {
        try {
          const joined = await getCommunities(userData.communities);
          setUserCommunities(joined);
        } catch (err) {
          console.error("Error loading user's communities:", err);
        }
      }
      setLoading(false);
    }

    loadData();
  }, [userData, loading]);

  const toggleEditPopup = () => {
    setEditOpen(!editOpen);
    setError(null);
  };

  const toggleIconPopup = () => {
    setIconOpen(!iconOpen);
    setError(null);
  };
  const toggleBannerPopup = () => {
    setBannerOpen(!bannerOpen);
    setError(null);
  };
  const toggleEditGroupPopup = () => {
    setEditGroupOpen(!editGroupOpen);
    setError(null);
  };
  const toggleModOptionsPopup = () => {
    setModOptionsOpen(!modOptionsOpen);
    setError(null);
  };
  const toggleBlacklistPopup = () => {
    setBlacklistOpen(!blacklistOpen);
    setError(null);
  };
  const toggleConfirmDeleteForum = () => {
    setConfirmDeleteForum(!confirmDeleteForum);
    setError(null);
  };
  const toggleConfirmDeleteGroup = () => {
    setConfirmDeleteGroup(!confirmDeleteGroup);
    setError(null);
  };

  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    commApi.fetchStructure(commName)
      .then((data) => {
        if (data) setCommunity(data);
      })
      .finally(() => setLoading(false));
  }, [commName]);

  useEffect(() => {
    if (!community) return;

    const groups = community.groupsInCommunity;
    if (!groups || groups.length === 0) return;

    const firstGroup = groups[0];
    const forums = firstGroup.forumsInGroup || [];

    if (forums.length === 0) return;

    router.replace(`/community/${commName}/${forums[0].slug}`);
  }, [community, commName, router]);

  if (loading) return <div>Loading community...</div>;
  if (!community) return <div>Community not found.</div>;

  return null;
}