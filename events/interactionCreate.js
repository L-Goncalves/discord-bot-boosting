import { InteractionType, PermissionsBitField, EmbedBuilder } from "discord.js";
import { client } from "../bot.js";
import {
  chooseAndReroll,
  createCustomChannel,
  handleSubmit
} from "../Commands/Functions/main.js";

client.on("interactionCreate", async (interaction) => {
  if (interaction.isModalSubmit()) {
    handleSubmit(interaction)
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
