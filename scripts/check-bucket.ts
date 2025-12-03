
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkBucket() {
    console.log("Checking for 'item-images' bucket...");
    const { data, error } = await supabase.storage.getBucket("item-images");

    if (error) {
        console.error("Error getting bucket:", error.message);
        if (error.message.includes("not found")) {
            console.log("Bucket 'item-images' does NOT exist.");
        }
    } else {
        console.log("Bucket 'item-images' exists!");
    }
}

checkBucket();
