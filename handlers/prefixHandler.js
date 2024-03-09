// prefixHandler.js
import { Bot } from "./Client.js";
import { readdir } from "node:fs/promises";

/**
 * @param {Bot} client
 */
export default async (client) => {
  try {
    console.log("> Prefix Handler Loaded");

    // Load Prefix Commands
    const prefixCommandsDir = await readdir(`./Commands/Prefix`);

    console.log(`> Found ${prefixCommandsDir.length} prefix commands`);

    await Promise.all(
      prefixCommandsDir.map(async (cmd) => {
        try {
          /**
           * @type {import("../index.js").PrefixCommand}
           */
          const command = await import(`../Commands/Prefix/${cmd}`).then(
            (r) => r.default
          );

          if (command.name) {
            client.prefixCommands.set(command.name, command);
            console.log(`> Loaded prefix command: ${command.name}`);
          }
        } catch (error) {
          console.error(
            `Error loading prefix command from file ${cmd}:`,
            error
          );
        }
      })
    );

    // Set up Prefix Commands
    client.on("messageCreate", (message) => {
      console.log(client.config.PREFIX);
      if (
        message.author.bot ||
        !message.content.startsWith(client.config.PREFIX)
      ) {
        return;
      }

      const args = message.content
        .slice(client.config.PREFIX.length)
        .trim()
        .split(/ +/);
      console.log(`> Args: ${args}`);
      const commandName = args.shift().toLowerCase();

      const prefixCommand = client.prefixCommands.get(commandName);
      if (prefixCommand) {
        console.log(`> Executing prefix command: ${commandName}`);
        // Execute your prefix command logic here
        prefixCommand.execute(message, args);
      } else {
        console.log(`> Prefix command not found: ${commandName}`);
      }
    });

    console.log(`> ✅ Loaded ${client.prefixCommands.size} Prefix Commands !!`);
  } catch (error) {
    console.error("Error reading the commands directory:", error);
  }
};
