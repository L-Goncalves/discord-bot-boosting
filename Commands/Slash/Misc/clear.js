import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";

/**
 * @type {import("../../../index.js").Scommand}
 */
export default {
  name: "clear",
  description: `Limpe o Chat de Mensagens`,
  userPermissions: PermissionFlagsBits.SendMessages,
  botPermissions: PermissionFlagsBits.SendMessages,
  category: "Misc",
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction) => {
    try {
      // Check if the user has the necessary permissions (MANAGE_MESSAGES)
      if (
        !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)
      ) {
        return interaction.reply(
          "You don't have the required permissions to use this command."
        );
      }

      // Fetch up to 100 messages (Discord API limit)
      const messages = await interaction.channel.messages.fetch({
        limit: 100,
      });

      console.log(messages.size);

      await interaction.channel.bulkDelete(messages, true);
      // Send a confirmation message
      const replyMessage = await interaction.reply(
        "Todas as mensagens foram deletadas..."
      );

      // Delete the reply message after a certain period of time (e.g., 5 seconds)
      setTimeout(async () => {
        await replyMessage.delete();
      }, 5000); // 5000 milliseconds = 5 seconds
    } catch (error) {
      console.error("Error clearing messages:", error);
      await interaction.editReply("An error occurred while clearing messages.");
    }
  },
};
