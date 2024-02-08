import {
  ApplicationCommandType,
  PermissionFlagsBits,
  ChannelType,
  PermissionsBitField
} from "discord.js";
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
    try {
      const { guild } = interaction;

      // Create or find the "boosts" channel
      let boostsChannel = guild.channels.cache.find(
        (c) => c.name === "boosts" && c.type === ChannelType.GuildText
      );
      if (!boostsChannel) {
        boostsChannel = await guild.channels.create({
          name: "boosts",
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id, // @everyone
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        });
      }

      // Create or find the "logs" channel
      let logsChannel = guild.channels.cache.find(
        (c) => c.name === "logs" && c.type === ChannelType.GuildText
      );
      if (!logsChannel) {
        logsChannel = await guild.channels.create({
          name: "logs",
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id, // @everyone
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        });
      }

      interaction.reply({ content: "Bot channels initialized successfully." });
    } catch (error) {
      interaction.reply({
        content: `Error initializing bot channels: ${error}`,
      });
    }
  },
};
