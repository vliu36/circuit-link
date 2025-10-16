import { useParams } from "next/navigation";

export default function CommunityPage() {
    const { slug } = useParams();

    return (
        <div style={{ padding: "40px" }}>
            <h1 style={{ padding: "32px" }}>Welcome to {slug}</h1>
            <p style={{ fontSize: "18px", marginTop: "20px" }}>
                This is a dynamic community page. Its a work in progress man so dont judge too hard
            </p>
        </div>
    );
}