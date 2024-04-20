// form.js
import { Client, ChannelType } from "discord.js";
import { createCustomChannel } from "../Functions/main.js";
/**
 * @type {import("../index.js").PrefixCommand}
 */
const command = {
  name: "aceitar",
  description: "Aceitar um boost",
  /**
   * @param {Client} client
   */
  execute: async (client, message, args) => {
    try {
      if (message.channel.name !== "💰┃boosts") {
        const msg = await message.reply(
          "Este comando só pode ser executado no canal #boosts."
        );

        setTimeout(async () => {
          await msg.delete();
          await message.delete();
        }, 2000);

        return;
      }

      const boostID = args[0]; // Extrair o ID do boost dos argumentos
      const user = message.author;
      const matchedMessageWithEmbed = await fetchMessagesRecursive(
        client,
        message,
        boostID
      );

      if (!matchedMessageWithEmbed && boostID && !boostID.includes("#")) {
        const msg = await message.reply({
          content: `Boost ${boostID} não encontrado!`,
        });

        setTimeout(async () => {
          await msg.delete();
          await message.delete();
        }, 3000);
      }

      if (
        matchedMessageWithEmbed &&
        !matchedMessageWithEmbed.content.includes(user.id)
      ) {
        const msg = await message.reply({
          content: `<@${user.id}>, Você não pode aceitar o Boost que é de outro usuário, aguarde a sua vez para aceitar.`,
        });

        setTimeout(async () => {
          await msg.delete();
          await message.delete();
        }, 5000);

        return;
      }

      if (!boostID) {
        try {
          const msg = await message.reply(
            `Por favor, forneça o código do boost a ser aceito.\n\nExemplo: !aceitar 999999\n\n**(não se esqueça de colocar espaço entre o comando e o código)**`
          );

          setTimeout(async () => {
            await msg.delete();
            await message.delete();
          }, 6000);
        } catch (error) {
          console.log(error);
        }

        return;
      }

      if (boostID.includes("#")) {
        const msg = await message.reply(
          "Por favor, forneça apenas os números do ID do boost.**Exemplo: !aceitar 999999**"
        );

        setTimeout(async () => {
          await msg.delete();
        }, 3000);

        return;
      }

      if (matchedMessageWithEmbed) {
        try {
          // Get the guild
          const guild = client.guilds.cache.get(message.guildId);

          const targetChannelId = guild.channels.cache.find(
            (c) => c.name === "💰┃boosts" && c.type === ChannelType.GuildText
          ).id;

          const logChannelId = guild.channels.cache.find(
            (c) => c.name === "💻┃dados" && c.type === ChannelType.GuildText
          ).id;

          const logChannel = client.channels.cache.get(logChannelId);

          const targetChannel = client.channels.cache.get(targetChannelId);

          const logMessage = await fetchMessagesLogRecursive(
            client,
            logChannel,
            message,
            boostID
          );

          const jsonToParse = logMessage.content
            .replace(/^```json\n/, "")
            .replace(/```$/, "")
            .replace(/\n/g, "");

          const fields = JSON.parse(jsonToParse);

          await createCustomChannel(user, targetChannel, fields, client); // Pass the targetChannel

          const accepted = await message.reply(`Boost ${boostID} foi aceito!`);
          try {
            setTimeout(async () => {
              await message.delete();
            }, 200);
            setTimeout(async () => {
              await accepted.delete();
            }, 3000);

            await matchedMessageWithEmbed.delete();
          } catch (error) {
            message.reply({ content: `Erro: ${error}` });
          }
        } catch (error) {
          message.reply({ content: `Erro: ${error}` });
        }
      }

      return;
    } catch (error) {
      console.error("Erro ao executar o comando de aceitar:", error);
      return message.reply(
        "Ocorreu um erro ao executar o comando. Por favor, tente novamente mais tarde."
      );
    }
  },
};

const fetchMessagesLogRecursive = async (
  client,
  logChannel,
  message,
  boostID,
  limit = 100,
  lastMessageId = null
) => {
  const fetchedMessages = await logChannel.messages.fetch({
    limit: 100,
    before: lastMessageId,
  });

  const firstMessageWithBoostID = fetchedMessages.find((msg) => {
    return msg.content.includes(boostID);
  });

  const lastFetchedMessage = firstMessageWithBoostID;
  if (firstMessageWithBoostID) {
    return firstMessageWithBoostID;
  }
  if (!lastFetchedMessage) {
    return null;
  }

  return fetchMessagesLogRecursive(
    client,
    logChannel,
    message,
    boostID,
    limit,
    lastFetchedMessage.id
  );
};

const fetchMessagesRecursive = async (
  client,
  message,
  boostID,
  limit = 100,
  lastMessageId = null
) => {
  const fetchedMessages = await message.channel.messages.fetch({
    limit: 100,
    before: lastMessageId,
  });

  const firstMessageWithEmbed = fetchedMessages.find((msg) => {
    if (msg.embeds.length > 0) {
      const embed = msg.embeds[0];
      const foundId = extractBoostIDFromEmbed(embed);
      return foundId.includes(boostID);
    }
    return false;
  });
  if (firstMessageWithEmbed) {
    return firstMessageWithEmbed;
  }

  const lastFetchedMessage = fetchedMessages.last();
  if (!lastFetchedMessage) {
    return null;
  }

  return fetchMessagesRecursive(
    client,
    message,
    boostID,
    limit,
    lastFetchedMessage.id
  );
};

function extractBoostIDFromEmbed(embed) {
  return embed.data.description.split("Código do Boost**:")[1];
}
export default command;
