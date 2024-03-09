import { Colors } from "discord.js";
import { config } from "dotenv";
config();

const settings = {
  TOKEN: process.env.TOKEN || "Bot_Token",
  PREFIX: process.env.TOKEN || "Bot_PREFIX",
  Owners: ["OwnersId", "OwnersId"],
  Slash: {
    Global: false,
    GuildID: process.env.GuildID || "Guild_Id",
  },
  embed: {
    color: Colors.Blurple,
    wrongColor: Colors.Red,
  },
  emoji: {
    success: "✅",
    error: "❌",
  },
};

export default settings;
