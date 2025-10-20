'use client';

import { useRouter } from "next/navigation";

export default function Database_Check() {
    const router = useRouter();

    const handleClick = async () => {
        try {
            // const response = await fetch("https://circuitlink-160321257010.us-west2.run.app/api/users/all"), {
            const response = await fetch(`${process.env.SERVER_URI}/api/users/all`, {     
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                // window.location.href = "https://circuitlink-160321257010.us-west2.run.app/api/users/all";
                window.location.href = `${process.env.SERVER_URI}/api/users/all`;
            }
            else {
                console.error("Request failed due to skill issue:", response.status);
            }
        }
        catch (error) {
            console.error("Error sending request:", error);
        }
    };

    return (
        <>
          <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
          />
          <div style={{ textAlign: "center" }}>
            <br />
            <h1 style={{ fontFamily: "'Orbitron', Arial, sans-serif", fontSize: 42 }}>Welcome to Circuit Link</h1>
            <br />
            <footer style={{ position: "fixed", left: 0, bottom: 0, width: "100%", textAlign: "center" }}>
              © 2025 Blue Circuit inc. All rights reserved.
            </footer>
          </div>

          {/* -------- Button to register page -------- */}
          <div style={{ textAlign: "center" }}>
            <br></br>
            <button style={{
              backgroundColor: "#699DD8",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background-color 0.2s",
            }} onClick={() => router.push("/register")}>
              Register
            </button>
          </div>

          <div style={{ textAlign: "center" }}>
            <br></br>
            <button style={{
              backgroundColor: "#699DD8",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background-color 0.2s",
            }} onClick={() => router.push("/signin")}>
              Sign In
            </button>
          </div>
        </>
    )
}
