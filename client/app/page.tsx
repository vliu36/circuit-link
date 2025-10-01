'use client';

import { useRouter } from "next/navigation";

export default function Database_Check() {
    const router = useRouter();

    const handleClick = async () => {
        try {
            const response = await fetch("/api/all", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: "Button clicked!" }),
            });

            if (response.ok) {
                window.location.href = "http://localhost:2400/api/all";
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
            <p>
              Database check for Professor to see...press button to see
            </p>
            <br />
            <button
              type="button"
              onClick={handleClick}
              style={{
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background-color 0.2s"
              }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = "#0056b3")}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = "#007bff")}
            >
              Click here
            </button>
            <footer className="box" style={{ position: "fixed", left: 0, bottom: 0, width: "100%", textAlign: "center" }}>
              © 2025 Blue Circuit inc. All rights reserved.
            </footer>
          </div>
        </>
    )
}
