import { client } from "../bot.js";

client.on("error", (error) => {
  console.error("Discord bot encountered an error:", error.message);
});
