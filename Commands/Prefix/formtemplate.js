// form.js
import { Client } from "discord.js";
import { verificationCard } from "../Functions/main.js";
/**
 * @type {import("../index.js").PrefixCommand}
 */
const formCommand = {
  name: "formtemplate",
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
BOOSTER:`;

      message.reply(example);

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
