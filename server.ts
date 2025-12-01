import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handler as shareListHandler } from "./api/share-list";
import { handler as authHandler } from "./api/auth";
import { handler as listsHandler } from "./api/lists";
import { handler as itemsHandler } from "./api/items";
import { handler as profilesHandler } from "./api/profiles";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, "dist")));

// API Routes
// We use a middleware to match the /api prefix and route to the appropriate handler
app.use("/api", async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathName = url.pathname.replace("/api/", "");

    try {
        if (pathName === "share-list" || pathName.startsWith("share-list/")) {
            await shareListHandler(req, res);
        } else if (pathName === "auth" || pathName.startsWith("auth/")) {
            await authHandler(req, res);
        } else if (pathName === "lists" || pathName.startsWith("lists/")) {
            await listsHandler(req, res);
        } else if (pathName === "items" || pathName.startsWith("items/")) {
            await itemsHandler(req, res);
        } else if (
            pathName === "profiles" || pathName.startsWith("profiles/")
        ) {
            await profilesHandler(req, res);
        } else {
            res.status(404).json({ error: "API endpoint not found" });
        }
    } catch (error) {
        console.error("API Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

// Catch-all handler for any request that doesn't match the above
// Send back React's index.html file.
app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
