import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, ".env");

console.log("Testing dotenv.config()...");
console.log("Expected .env path:", envPath);
console.log(".env file exists:", existsSync(envPath));

if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  const hasMongoUri = content.includes("MONGO_URI");
  console.log(".env contains MONGO_URI:", hasMongoUri);
  if (hasMongoUri) {
    const mongoLine = content.split("\n").find(line => line.startsWith("MONGO_URI"));
    console.log("MONGO_URI line:", mongoLine?.substring(0, 50) + "...");
  }
}

const result = dotenv.config({ path: envPath });
console.log("dotenv.config() result:", result.error ? "ERROR: " + result.error.message : "SUCCESS");
console.log("process.env.MONGO_URI exists:", !!process.env.MONGO_URI);
if (process.env.MONGO_URI) {
  console.log("MONGO_URI value (first 30 chars):", process.env.MONGO_URI.substring(0, 30) + "...");
}
