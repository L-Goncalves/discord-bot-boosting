import { ActivityType } from "discord.js";
import { client } from "../bot.js";

client.on("ready", async () => {
  console.log(`> ${client.user.tag} is Ready !!`);
  client.user.setActivity({
    name: `Boosts🔄`,
    type: ActivityType.Watching,
  });
});
