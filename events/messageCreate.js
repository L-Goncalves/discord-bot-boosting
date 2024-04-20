import { PermissionsBitField } from "discord.js";
import { cooldown } from "../handlers/functions.js";
import { client } from "../bot.js";
import { readdir } from "node:fs/promises";
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild || !message.id) return;
  let prefix = client.config.PREFIX;
  const prefixCommandsDir = await readdir(`./Commands/Prefix`);

  const actualCommands = prefixCommandsDir.map(
    (command) => `!` + command.toLowerCase().replace(".js", "")
  );

  // Check if the message is sent in the #boosts channel
  if (message.channel.name === "💰┃boosts") {
    // If the message is not a command, delete it
    if (!message.content.startsWith(prefix)) {
      try {
        await message.delete();

        const msg = await message.reply(
          "Esse canal serve apenas para boosts, você não pode conversar aqui."
        );

        setTimeout(async () => {
          await msg.delete();
        }, 3000);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
      return;
    } else if (
      message.content.startsWith(prefix) &&
      !actualCommands.includes(message.content.toLowerCase().split(" ")[0])
    ) {
      try {
        await message.delete();

        const msg = await message.reply(
          "Esse canal serve apenas para boosts, você não pode conversar aqui."
        );

        setTimeout(async () => {
          await msg.delete();
        }, 3000);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
      return;
    }
  }

  let mentionprefix = new RegExp(
    `^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`
  );
  if (!mentionprefix.test(message.content)) return;
  const [, nprefix] = message.content.match(mentionprefix);
  const args = message.content.slice(nprefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  if (cmd.length === 0) {
    if (nprefix.includes(client.user.id)) {
      return client.sendEmbed(
        message,
        ` ${client.config.emoji.success} To See My All Commands Type  \`/help\` or \`${prefix}help\``
      );
    }
  }
  /**
   * @type {import("..").Mcommand}
   */
  const command =
    client.mcommands.get(cmd) ||
    client.mcommands.find((cmds) => cmds.aliases && cmds.aliases.includes(cmd));
  let Owners = client.config.Owners;
  if (!command) return;
  if (command) {
    if (command.owneronly && !Owners.includes(message.author.id)) {
      return client.sendEmbed(
        message,
        `Only ${Owners.map((m) => `<@${m}>`)} Can Use This Command`
      );
    } else if (
      command.userPermissions &&
      !message.member.permissions.has(
        PermissionsBitField.resolve(command.userPermissions)
      )
    ) {
      return client.sendEmbed(message, `You don't have enough Permissions !!`);
    } else if (
      command.botPermissions &&
      !message.guild.members.me.permissions.has(
        PermissionsBitField.resolve(command.botPermissions)
      )
    ) {
      return client.sendEmbed(message, `I don't have enough Permissions !!`);
    } else if (cooldown(message, command)) {
      return client.sendEmbed(
        message,
        ` You are On Cooldown , wait \`${cooldown(
          message,
          command
        ).toFixed()}\` Seconds`
      );
    } else {
      command.run(client, message, args, prefix);
    }
  }
});

function escapeRegex(newprefix) {
  return newprefix?.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}
