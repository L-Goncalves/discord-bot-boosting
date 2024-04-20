import { InteractionType, PermissionsBitField, EmbedBuilder } from "discord.js";
import { client } from "../bot.js";
import {
  handleBoostSubmit,
  firstModal,
  secondModal,
  deleteBoost,
} from "../Commands/Functions/main.js";

client.on("interactionCreate", async (interaction) => {
  const customId = interaction.customId;

  if (interaction.customId && customId.includes("send-boosts")) {
    const response = await handleBoostSubmit(interaction, customId);
    try {
      if (response instanceof Error) {
        interaction.reply({ content: response.message });
      } else {
        return;
      }
    } catch (error) {
      console.log("An error ocurred but app didnt crash", error);
    }
  }

  if (interaction.customId && customId.includes("send-firstpage")) {
    firstModal(client, interaction);
  }

  if (interaction.customId && customId.includes("send-secondpage")) {
    secondModal(client, interaction);
  }

  if (interaction.customId && customId.includes("delete-boost")) {
    deleteBoost(interaction);
  }

  if (interaction.isCommand() && !interaction.user.bot && interaction.guild) {
    const command = client.scommands.get(interaction.commandName);

    if (!command) {
      return client.send(interaction, {
        content: `\`${interaction.commandName}\` is not a valid command!!`,
        ephemeral: true,
      });
    }

    // Check user permissions
    if (
      command.userPermissions &&
      !interaction.member.permissions.has(
        PermissionsBitField.resolve(command.userPermissions)
      )
    ) {
      return client.sendEmbed(
        interaction,
        `You don't have enough permissions!!`
      );
    }

    // Check bot permissions
    if (
      command.botPermissions &&
      !interaction.guild.members.me.permissions.has(
        PermissionsBitField.resolve(command.botPermissions)
      )
    ) {
      return client.sendEmbed(interaction, `I don't have enough permissions!!`);
    }

    // Run the command
    command.run(client, interaction);
  }
});
