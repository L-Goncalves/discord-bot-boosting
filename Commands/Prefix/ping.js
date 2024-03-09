// ping.js
/**
 * @type {import("../index.js").PrefixCommand}
 */
const pingCommand = {
  name: "ping",
  description: "Ping command",
  execute: async (message, args) => {
    try {
      await message.reply("Pong!");
    } catch (error) {
      console.error("Error executing ping command:", error);
    }
  },
};

export default pingCommand;
