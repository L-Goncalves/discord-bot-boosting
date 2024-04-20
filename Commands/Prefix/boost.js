// form.js
import { Client } from "discord.js";
import { verificationCard } from "../Functions/main.js";
/**
 * @type {import("../index.js").PrefixCommand}
 */
const formCommand = {
  name: "boost",
  description: "template for the form",
  /**
   * @param {Client} client
   */
  execute: async (client, message, args) => {
    try {
      const example = `

      ORDER DESCRIPTION: 
ROLE:
PRICE: 
EMAIL: 
PASSWORD:

EXTRA:
BOOSTER:
TIME:`;
      await message.delete();
      const msg = await message.reply(example);
      setTimeout(async () => {
        await msg.delete();
      }, 5000);
      return;
    } catch (error) {
      console.error("Error executing form command:", error);
      return;
    }
  },
};

function extractValue(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : "Not found";
}

export default formCommand;
