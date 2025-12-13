import { db, auth } from "../firebase.ts";
import { Request, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { cookieParser } from "./_utils/generalUtils.ts";
import { createNotification } from "./_utils/generalUtils.ts";

interface UserData {
    uid: string;
    email: string;
    username: string;
    createdAt: FirebaseFirestore.Timestamp;
    profileDesc?: string;
    darkMode?: boolean;
    privateMode?: boolean;
    restrictedMode?: boolean;
    textSize?: number;
    font?: string;
    photoURL?: string;
    emailVerified?: boolean;
    // [key: string]: any; // for any additional fields
}

// Retrieves all documents in Users
const getAllDocuments = async (req: Request, res: Response) => {
    try {
        const usersRef = db.collection("Users");
        const snapshot = await usersRef.get();
        
        res.status(200).json({
            status: "OK",
            message: snapshot.docs.map(doc => doc.data())
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
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
            textSize: 12,           // TODO: Change to a different default size
            font: "Arial",          // TODO: Change to a different default font
            notifications: [],
            communities: [],
            friendList: [],
            photoURL: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
            yayScore: 0,
        });

        res.status(201).json({ message: "User created successfully", uid: userId })
    } 
    catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ 
            status: "backend error",
            message: "Failed to register user.\n" + err
        }); 
    } // end try catch
} // end function userRegistration


// Google setup revised
// Sets up default user values for Google sign-in
const userRegistrationGoogle = async (req: Request, res: Response) => {
    const { idToken, photoURL } = req.body;

    if (!idToken) {
        return res.status(400).json({ status: "error", message: "Missing ID token" });
    }
    let uid: string | null = null;

    try {
        // Verify token
        const decodedToken = await auth.verifyIdToken(idToken);
        // const { email } = decodedToken;
        const email = decodedToken.email;
        uid = decodedToken.uid;
        if (!uid || !email) {
            return res.status(400).json({ status: "error", message: "Invalid token data" });
        }
        console.log("Verified Firebase token for user: ", email, uid);

        const userDoc = db.collection("Users").doc(uid);
        const docSnap = await userDoc.get();

        // Create session cookie via Admin SDK
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        res.cookie("session", sessionCookie, {
            httpOnly: true,
            secure: true,
            maxAge: expiresIn,
            sameSite: "none",
        });
        console.log("Created session cookie for user: ", uid);

        // Check if user document already exists in Firestore
        if (docSnap.exists) {
            console.log("Google signin successful.");
            return res.status(200).json({ status: "ok", message: "Google signin successful."});
        }

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
            photoURL: photoURL,
            friendList: [],
            yayScore: 0,
        }

        try {
            await userDoc.set(newUser);
        } catch (firestoreWriteErr) {
            console.error("Firestore write failed: ", firestoreWriteErr);
            // Rollback Auth user creation
            await auth.deleteUser(uid);
            return res.status(500).json;
        } // end try catch

        // On success
        console.log("Google user registered successfully.");
        return res.status(200).json({
            status: "ok",
            message: "Google user registered successfully",
            user: newUser,
        });

    } catch (err) {
        if (err instanceof Error) {
            console.error("Google registration error: ", err.message);
            return res.status(500).json({
                status: "error",
                message: err.message || "Server error during registration",
            });
        } else {
            console.error("Google registration error: ", err);
            return res.status(500).json({
                status: "error",
                message: err,
            });
        } // end if else
    } // end try catch
} // end userRegistrationGoogle

// Login user with email and password
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
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        res.cookie("session", sessionCookie, {
            httpOnly: true,
            secure: true,
            maxAge: expiresIn,
            sameSite: "none",
        });
        console.log("Created session cookie for user:", uid);

        res.status(200).json({ message: "Login successful" });
    } catch (err) {
        console.error("Login failed:", err);
        res.status(401).json({message: "Invalid email or password" });
    } // end try catch
} // end function userLogin

// Delete user document revised
const deleteDoc = async (req: Request, res: Response) => {
    try {
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) {
            return res.status(401).json({ message: "Missing token" });
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
} // end function deleteDoc

// Edit profile
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
            sameSite: "none",
        });
        console.log("Logout successful");
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Failed to clear session cookie:", error);
        res.status(500).json({ message: "Failed to clear session cookie" });
    } // end try catch
} // end logoutUser

// Update user document communities field
const updateCommunityField = async (req: Request, res: Response) => {
    try {
        const uid = req.params.uid;
        const mode = req.body.mode;
        const commRef = req.body.community;

        if (mode) {
            const user = await db.collection("Users").doc(uid);
            await user.update({
                communities: FieldValue.arrayUnion(db.doc(`/Communities/${commRef}`))
            });
        }
        else {
            const user = await db.collection("Users").doc(uid);
            await user.update({
                communities: FieldValue.arrayRemove(db.doc(`/Communities/${commRef}`))
            });
        }

        res.status(200).send({
            status: "OK",
            message: `Successfully updated community field in document: ${uid}`
        })
    }
    catch (err) {
        res.status(500).send({
            status: "Backend error",
            message: err
        })
    }
}

// Get user by id
const getUserById = async (req: Request, res: Response) => {
    try {
        const uid = req.params.uid;
        const userDoc = await db.collection("Users").doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const data = userDoc.data() as UserData;
        const safeUserData = { 
            ...data,
            createdAt: userDoc.createTime?.toMillis() || null,
        };

        res.status(200).json({ user: safeUserData });
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Failed to fetch user" });
    } // end try catch
}

// Send friend request
const sendFriendRequest = async (req: Request, res: Response) => {
    const { senderId, recipientId } = req.body;
    if (!senderId || !recipientId) {
        return res.status(400).json({ status: "error", message: "Missing senderId or recipientId" });
    }

    try {
        // Check if request already exists
        const existing = await db.collection("FriendRequests")
            .where("senderId", "==", senderId)
            .where("recipientId", "==", recipientId)
            .where("status", "==", "pending")
            .get();
        if (!existing.empty) {
            console.log("Friend request already sent.");
            return res.status(400).json({ status: "exists", message: "Friend request already sent" });
        }

        // Get sender's username for notification
        const senderDoc = await db.collection("Users").doc(senderId).get();
        const senderData = senderDoc.data();
        const senderUsername = senderData?.username || "Someone";
        
        // Create friend request
        const requestRef = await db.collection("FriendRequests").add({
            senderId,
            recipientId,
            status: "pending",
            timestamp: new Date(),
        });

        // Notify the recipient
        const notifRef = await createNotification({
            senderId,
            recipientIds: [recipientId],
            type: "friend_request",
            message: `${senderUsername} has sent you a friend request.`,
            relatedDocRef: requestRef,
        });
        // Add reference to notification in recipient's document under field 'notifications'
        const recipientRef = db.collection("Users").doc(recipientId);
        await recipientRef.update({
            notifications: FieldValue.arrayUnion(db.doc(`/Notifs/${notifRef}`))
        });

        res.status(201).json({ status: "ok", message: "Friend request sent successfully" });
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ status: "error", message: "Failed to send friend request" });
    } // end try catch
} // end sendFriendRequest

// Respond to friend request
const respondToFriendRequest = async (req: Request, res: Response) => {
    const { 
        requestId,      // ID of the friend request document
        accept,         // true to accept, false to reject
        recId           // ID of the recipient (current user)
    } = req.body;

    try {
        // Fetch the friend request document and check if it exists
        const requestDoc = await db.collection("FriendRequests").doc(requestId).get();
        if (!requestDoc.exists) {
            return res.status(404).json({ status: "error", message: "Friend request not found" });
        }

        // Extract senderId and recipientId from the request document
        const { senderId, recipientId } = requestDoc.data() as { senderId: string; recipientId: string; };
        // Verify that the recId matches the recipientId
        if (recId !== recipientId) {
            return res.status(403).json({ status: "error", message: "Unauthorized action" });
        }

        // Update the friend request status
        const newStatus = accept ? "accepted" : "rejected";
        await db.collection("FriendRequests").doc(requestId).update({
            status: newStatus,
            respondedAt: new Date(),
        });
        // If accepted, update both users' friend lists and notify the sender
        if (accept) {
            await db.collection("Users").doc(senderId).update({
                friendList: FieldValue.arrayUnion(db.doc(`/Users/${recipientId}`))
            });
            await db.collection("Users").doc(recipientId).update({
                friendList: FieldValue.arrayUnion(db.doc(`/Users/${senderId}`))
            });

            // Get recipient's username for notification
            const recipientDoc = await db.collection("Users").doc(recipientId).get();
            const recipientData = recipientDoc.data();
            const recipientUsername = recipientData?.username || "Someone";

            await createNotification({
                senderId: recipientId,
                recipientIds: [senderId],
                type: "friend_request_accepted",
                message: `User ${recipientUsername} has accepted your friend request.`,
            });
        } 

        res.status(200).json({ status: "ok", message: `Friend request ${newStatus}` });
    } catch (error) {
        console.error("Error responding to friend request:", error);
        res.status(500).json({ status: "error", message: "Failed to respond to friend request" });
    } // end try catch
} // end respondToFriendRequest

// Remove friend
const removeFriend = async (req: Request, res: Response) => {

    try {
        const { friendId } = req.body;
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) {
            return res.status(401).json({ status: "error", message: "Missing token" });
        }
        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;

        await db.collection("Users").doc(userId).update({
            friendList: FieldValue.arrayRemove(db.doc(`/Users/${friendId}`))
        });
        await db.collection("Users").doc(friendId).update({
            friendList: FieldValue.arrayRemove(db.doc(`/Users/${userId}`))
        });

        console.log(`Friend removed successfully for user ${userId} and friend ${friendId}.`);
        res.status(200).json({ status: "ok", message: "Friend removed successfully" });
    } catch (error) {
        console.error("Error removing friend:", error);
        res.status(500).json({ status: "error", message: "Failed to remove friend" });
    } // end try catch
} // end removeFriend

// Get top 10 users by yayScore
const getTopUsers = async (req: Request, res: Response) => {
    try {
        const usersSnap = await db
            .collection("Users")
            .orderBy("yayScore", "desc")
            .limit(10)
            .get();

        const users = usersSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                username: data.username || "",
                photoURL: data.photoURL || "",
                yayScore: data.yayScore || 0,
            };
        });

        res.status(200).send({
            status: "ok",
            users,
        });
    } catch (err) {
        console.error("Error fetching top users:", err);
        res.status(500).send({
            status: "error",
            message: "Failed to fetch top users",
        });
    }
};

export {
    getAllDocuments,
    userRegistration,
    userLogin,
    updateCommunityField,
    deleteDoc,
    userRegistrationGoogle,
    editProfile,
    getCurrentUser,
    logoutUser,
    getUserById,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    getTopUsers,
}