import { db, auth } from "../firebase.ts";
import { Request, Response } from "express";

// const auth = getAdminAuth();

// Function to assist in parsing session cookie
function cookieParser(req: Request): Record<string, string> {
    // Extract and parse cookies
    const cookieHeader = req.headers.cookie || "";
    const cookies: Record<string, string> = Object.fromEntries(
        cookieHeader
            .split(";")
            .map((pair) => pair.trim().split("="))
            .filter(([key, val]) => key && val)
            .map(([key, val]) => [key, decodeURIComponent(val)])
    )
    return cookies;
}

// Retrieves all documents in Users
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const usersRef = db.collection("Users");
        const snapshot = await usersRef.get();
        
        res.status(200).send({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).send({
            status: "backend error",
            message: err
        })
    }    
}

// Signs up a user, storing information in the Firestore Database
const userRegistration = async (req: Request, res: Response) => {
    try {
        const { email, password, username } = req.body;

        // Creates a new Firebase Authentication user 
        const userCred = auth.createUser({
            email: email,
            emailVerified: false,
            // phoneNumber: req.body.phoneNumber,
            password: password,
            // photoURL: "https://storage.googleapis.com/circuit-link-images/profiles/default.png", // Swap to this default image later
            photoURL: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
            displayName: username,
        })

        // Gets the newly created user's ID
        const userId = (await userCred).uid;

        // Creates a new Firestore document for the user with their uid
        // const db = getFirestore();
        await db.collection("Users").doc(userId).set({
            email: email, 
            password: password,
            username: username,
            createdAt: new Date(),
            profileDesc: "Hi! I'm still setting up my profile.",
            darkMode: true,
            privateMode: false,
            restrictedMode: false,
            textSize: 12,           
            font: "Arial",          
            notifications: [],
            communities: [],
            photoURL: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
        });

        res.status(201).json({ message: "User created successfully", uid: userId })
    } 
    catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send({ 
            status: "backend error",
            message: "Failed to register user.\n" + err
        }); 
    } // end try catch
} // end function userRegistration

// ---- Login user with email and password ---- //
const userLogin = async (req: Request, res: Response) => {
    const { idToken } = req.body;
    
    if (!idToken) {
        return res.status(400).json({ status: "error", message: "Missing ID token" });
    }
    try {
        // Verify token
        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, email } = decodedToken;
        if (!uid || !email) {
            return res.status(400).json({ status: "error", message: "Invalid token data" });
        }
        console.log("Verified Firebase token for user:", email, uid);

        // Create session cookie via Admin SDK
        const expiresIn = 60 * 60 * 24 * 3 * 1000; // 3 day
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        res.cookie("session", sessionCookie, {
            httpOnly: true,
            secure: true,                                                                    
            maxAge: expiresIn,
            sameSite: "lax",
        });
        console.log("Created session cookie for user:", uid);

        res.status(200).json({ message: "Login successful "});
    } catch (error) {
        console.error("Login failed:", error);
        res.status(401).json({ message: "Invalid email or password "});
    } // end try catch
} // end function userLogin 

// ---- Google setup revised ---- //
const setupGoogleUser = async (req: Request, res: Response) => {
    const { idToken, photoURL } = req.body;

    if (!idToken) {
        return res.status(400).json({ status: "error", message: "Missing ID token" });
    }
    let uid: string | null = null;

    try {
        // Verify token
        const decodedToken = await auth.verifyIdToken(idToken);
        const { email } = decodedToken;
        uid = decodedToken.uid;
        if (!uid || !email) {
            return res.status(400).json({ status: "error", message: "Invalid token data" });
        }
        console.log("Verified Firebase token for user:", email, uid);

        const userDoc = db.collection("Users").doc(uid);
        const docSnap = await userDoc.get();

        // Create session cookie via Admin SDK
        const expiresIn = 60 * 60 * 24 * 3 * 1000; // 3 day
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        res.cookie("session", sessionCookie, {
            httpOnly: true,
            secure: true,                                                                                    
            maxAge: expiresIn,
            sameSite: "lax",
        });
        console.log("Created session cookie for user:", uid);
        
        // Check if user document alredy exists in Firestore
        if (docSnap.exists) {
            console.log("Google login successful");
            return res.status(200).json({ status: "ok", message: "Google login successful" });
        } // end if

        // Otherwise, create new Firestore document for the user
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        const defaultUsername = `User${day}${hour}${minute}`;

        const newUser = {
            uid,
            email, 
            username: defaultUsername,
            password: "N/A",
            createdAt: now,
            profileDesc: "Hi! I'm still setting up my profile.",
            darkMode: true,
            privateMode: false,
            restrictedMode: false,
            textSize: 12,           
            font: "Arial",          
            notifications: [],
            communities: [],
            photoURL: photoURL
        }
        try {
            await userDoc.set(newUser);
        } catch (err) {
            console.error("Firestore write failed:", err);
            // Rollback Auth user creation
            await auth.deleteUser(uid);
            return res.status(500).json
        }

        console.log("Google user registered successfully.");
        return res.status(200).json({
            status: "OK",
            message: "User registered successfully",
            user: newUser,
        })
    } catch (error: any) {
        console.error("Google registration error:", error);
        // Rollback Auth user creation
        if (uid) {
            try {
                await auth.deleteUser(error.uid);
                console.log("Rolled back Firebase Auth user due to failure.");
            } catch (deleteError) {
                console.error("Rollback failed:", deleteError);
            } // end try catch
        } // end if
        
        return res.status(500).json({
            status: "error",
            message: error.message || "Server error during registration",
        });
    } // end try catch
} // end function registerUserWithGoogle

// ---- Delete user ---- //
const deleteUserAccount = async (req: Request, res: Response) => {
    try {
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) {
            return res.status(401).json({ message: "Missing token " });
        }

        // Verify token and extract UID
        const decoded = await auth.verifyIdToken(idToken);
        const uid = decoded.uid;

        // Delete Firestore user doc and Firebase Auth account
        await db.collection("Users").doc(uid).delete();
        await auth.deleteUser(uid);

        res.status(200).json({ message: "User account deleted", uid });
    } catch (error: any) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: "Failed to delete user: " + error.message });
    } // end try catch
} // end function deleteUserAccount

// ---- Edit profile ---- //
const editProfile = async (req: Request, res: Response) => {
    try {
        // Verify Firebase token
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) {
            return res.status(401).json({ status: "error", message: "Missing token" });
        }
        const decoded = await auth.verifyIdToken(idToken);
        const uid = decoded.uid;

        const {
            username,
            profileDesc,
            textSize,
            font,
            darkMode,
            privateMode,
            restrictedMode,
        } = req.body;

        const updates = {
            ...(username && { username }),
            ...(profileDesc && { profileDesc }),
            ...(textSize && { textSize }),
            ...(font && { font }),
            darkMode,
            privateMode,
            restrictedMode,
            updatedAt: new Date(),
        };

        // Update Firestore document
        const userRef = db.collection("Users").doc(uid);
        await userRef.update(updates);

        // Update Firebase Auth displayName with new username if provided
        if (username) {
            await auth.updateUser(uid, { displayName: username });
        }
        
        return res.status(200).json({ success: true, message: "Profile updated successfully." });
    } catch (error: any) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: error.message });
    } // end try catch
} // end editProfile

// Get signed in user data
const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const cookies = cookieParser(req);
        const sessionCookie = cookies.session || "";
        
        // Verify session cookie with Firebase Admin
        const decoded = await auth.verifySessionCookie(sessionCookie, true);

        // Fetch user Firestore document
        const userDoc = await db.collection("Users").doc(decoded.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User document not found" });
        }

        const userData = {
            ...decoded,         // Auth data
            ...userDoc.data(),  // Doc data
        };
        
        return res.status(200).json({
            user: userData,
            message: "User found"
        });
    } catch (error) {
        console.error("Failed to fetch current user:", error);
        res.status(401).json({ message: "Unauthorized" });
    } // end try catch
} // end getUserInfo

// Logout user by clearing session cookie
const logoutUser = async (req: Request, res: Response) => {
    try {
        cookieParser(req);

        res.clearCookie("session", {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
        });
        console.log("Logout successful");
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Failed to clear session cookie:", error);
        res.status(500).json({ message: "Failed to clear session cookie" });
    } // end try catch
} // end logoutUser

export {
    getAllDocuments,
    userRegistration,
    userLogin,
    setupGoogleUser,
    deleteUserAccount,
    editProfile,
    getCurrentUser,
    logoutUser
}

        // // Extract and parse cookies
        // const cookieHeader = req.headers.cookie || "";
        // const cookies: Record<string, string> = {};
        // cookieHeader.split(";").forEach((c) => {
        //     const [key, val] = c.split("=");
        //     if (key && val) cookies[key.trim()] = decodeURIComponent(val.trim());
        // });

        // const sessionCookie = cookies["session"];
        // if (!sessionCookie) {
        //     console.log("No session cookie found.");
        //     return res.status(401).json({ message: "Not signed in" });
        // }