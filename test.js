import { MongoDB } from "./src/database.js";

const db = new MongoDB();
await db.connect();

console.log(await db.getUserScores('kartikeyamani'));