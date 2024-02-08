import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";
import { initializeBotChannels } from "../../Functions/main.js"
/**
 * @type {import("../../../index.js").Scommand}
 */
export default {
  name: "start",
  description: `Setup bot`,
  userPermissions: PermissionFlagsBits.SendMessages,
  botPermissions: PermissionFlagsBits.SendMessages,
  category: "Setup",
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    // Code
    await initializeBotChannels(interaction.guild);
  },
};
