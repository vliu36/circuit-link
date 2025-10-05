'use client';

import { useRouter } from "next/navigation";

export default function Database_Check() {
    const router = useRouter();

    const handleClick = async () => {
        try {
            //const response = await fetch("https://circuitlink-160321257010.us-west2.run.app/api/all", {
            const response = await fetch("http://localhost:2400/api/all", {     // Local testing  
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                //body: JSON.stringify({ message: "Button clicked!" }),         <-- Error: No body needed for GET request
            });

            if (response.ok) {
                //window.location.href = "https://circuitlink-160321257010.us-west2.run.app/api/all";
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
        <main>
          <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
          />
          <div style={{ textAlign: "center" }}>
            <br />
            <h1 style={{ fontFamily: "'Orbitron', Arial, sans-serif", fontSize: 42 }}>Welcome to <span style={{ fontFamily: 'Cursive'}}>Joe's Lab</span></h1>
            <p>
              Just experimenting...
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
              Data Dump
            </button>
            <footer className="box" style={{ position: "fixed", left: 0, bottom: 0, width: "100%", textAlign: "center" }}>
              © 2025 Blue Circuit inc. All rights reserved.
            </footer>
          </div>

          <div>
            {/* Form for adding data to Firestore */}
            <form action="http://localhost:2400/api/post" method="post" style={{ textAlign: "center", marginTop: "20px" }}>
              <input type="text" name="name" placeholder="Name" required style={{ marginRight: "10px", padding: "5px", border: "2px", borderColor: "white" }} />
              <input type="email" name="email" placeholder="Email" required style={{ marginRight: "10px", padding: "5px" }} />
              <button type="submit" style={{ padding: "5px 20px", cursor: "pointer" }}>Submit</button>
            </form>
          </div>

          <div>
            {/* Delete user information */}

            {/** This is an old method that uses a POST request instead of a DELETE request. */}
            {/* <form action="http://localhost:2400/api/delete" method="post" style={{ textAlign: "center", marginTop: "20px" }}>
              <input type="email" name="email" placeholder="Email to Delete" required style={{ marginRight: "10px", padding: "5px", border: "2px", borderColor: "white" }} />
              <button type="submit" style={{ padding: "5px 20px", cursor: "pointer" }}>Delete User</button>
            </form> */}


            {/** This is the new method that uses a DELETE request instead of a POST request. */}
            <form 
            // Use an async function to handle the form submission
            // This prevents the default form submission behavior and allows us to use fetch with the DELETE method
            onSubmit={async (e) => {
              // Prevent the default form submission behavior
              // We want this because we are handling the submission with JavaScript
              // If we don't prevent it, the page will reload and we will lose our state 
              e.preventDefault();
              // Get the email value from the form
              // Use FormData to extract the form values
              // This is a standard way to handle form data in JavaScript
              const formData = new FormData(e.currentTarget);
              const email = formData.get("email");
              // Send a DELETE request to the server with the email in the body
              try {
                await fetch(`http://localhost:2400/api/delete`, {
                  method: "DELETE",
                  // Set the headers to indicate that we're sending JSON data
                  headers: {
                    "Content-Type": "application/json",
                  },
                  // Convert the email to a JSON string and include it in the body of the request
                  body: JSON.stringify({ email }),
                });
                // If the request is successful, alert the user
                alert(`User with email ${email} deleted successfully.`);
              } catch (error) {
                // If there's an error, log it and alert the user
                console.error("Error deleting user:", error);
                alert("Failed to delete user.");
              };
            }} style={{ textAlign: "center", marginTop: "20px" }}>
              <input type="email" name="email" placeholder="Email to Delete" required style={{ marginRight: "10px", padding: "5px", border: "2px", borderColor: "white" }} />
              <button type="submit" style={{ padding: "5px 20px", cursor: "pointer" }}>Delete User</button>
            </form>
          </div>
        </main>
    )
}
