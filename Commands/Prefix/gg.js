// form.js
import { Client, ChannelType, EmbedBuilder } from "discord.js";
import { createCustomChannel } from "../Functions/main.js";
/**
 * @type {import("../index.js").PrefixCommand}
 */
const formCommand = {
  name: "gg",
  description: "Finalizar o Boost de um usuário.",
  /**
   * @param {Client} client
   */
  execute: async (client, message, args) => {
    try {
      const isAdmin = message.member.permissions.has("ADMINISTRATOR");

      let category = message.channel.guild.channels.cache.find(
        (c) =>
          c.name === "🔴▸⎾ Boosts Ativos⏌◂🔴" &&
          c.type === ChannelType.GuildCategory
      );

      if (category.id !== message.channel.parentId) {
        const msg = await message.reply(`Comando não é permitido nesse canal!`);

        setTimeout(async () => {
          await msg.delete();
          await message.delete();
        }, 5000);
        return;
      }

      if (!isAdmin) {
        return;
      }

      const [msg, size] = await fetchMessagesRecursive(client, message);

      const boostHistoryChannelId = client.channels.cache.find(
        (c) => c.name === "📖┃histórico" && c.type === ChannelType.GuildText
      ).id;

      if (msg) {
        const boostHistory = client.channels.cache.get(boostHistoryChannelId);

        const { description, title } = msg.embeds[0].data;

        const regexId = /\*\*Código do boost:\*\* (\d+)/;
        const regexUser = /iniciado\s(.*?)\!/;
        // Using the exec function to find the pattern in the string
        const match = description.match(regexId);

        const matchUser = regexUser.exec(description);
        const role = extractValue(description, "**Role**:").toUpperCase();
        const payValue = extractValue(
          description,
          "**Valor a ser pago**:"
        ).toUpperCase();
        const rankDescription = extractValue(
          description,
          "**Descrição**:"
        ).toUpperCase();

        const email = extractValue(description, "**Email**:");

        const now = new Date();
        const datetime = `${now.getDate().toString().padStart(2, "0")}/${(
          now.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")} - ${now
          .getHours()
          .toString()
          .padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

        const boostHistoryEmbed = new EmbedBuilder()
          .setColor(0x9747ff)
          .setTitle(`Boost Concluído ${match ? `` : ""} `)
          .setDescription(
            `
        ${match ? `**Código do Boost**: #${match[1]}` : ""}
        ${matchUser ? `**Finalizado Boost de**: ${matchUser[1]}` : ""}
        **Role**: ${role}
        ${payValue ? `**Valor**: ${payValue}` : ``}
        **Descrição Rank**: ${rankDescription}
        **Email**: ${email}
        **Data**: ${datetime}
          `
          )

          .setTimestamp();

        boostHistory.send({ embeds: [boostHistoryEmbed] });

        const sentMsg = await msg.reply(
          `Encerrando Esse Canal! Boost Finalizado!`
        );

        setTimeout(async () => {
          await sentMsg.delete();
          await message.channel.delete();
        }, 5000);
      }
    } catch (error) {
      console.error("Erro ao executar o comando de aceitar:", error);
      return message.reply(
        "Ocorreu um erro ao executar o comando. Por favor, tente novamente mais tarde."
      );
    }
  },
};

const fetchMessagesRecursive = async (
  client,
  message,
  limit = 100,
  lastMessageId = null,
  count = 0
) => {
  const fetchedMessages = await message.channel.messages.fetch({
    limit: 100,
    before: lastMessageId,
  });

  if (count > 100) {
    count = count - 100;
  }
  count = count + fetchedMessages.size;

  const firstMessageWithEmbed = fetchedMessages.find((msg) => {
    if (msg.embeds.length > 0) {
      const embed = msg.embeds[0].data;
      return msg.embeds.length > 0 && embed.type.includes("rich");
    }
    return false;
  });
  if (firstMessageWithEmbed) {
    return [firstMessageWithEmbed, count];
  }

  const lastFetchedMessage = fetchedMessages.last();
  if (!lastFetchedMessage) {
    return [null, count];
  }

  return fetchMessagesRecursive(
    client,
    message,
    limit,
    lastFetchedMessage.id,
    fetchedMessages.size + count
  );
};

function extractValue(text, targetKey) {
  const lines = text.split("\n").filter((line) => {
    return line !== "";
  });
  let targetValue = "Not found";

  // If the target key is "ORDER DESCRIPTION", handle it separately
  if (targetKey === "ORDER DESCRIPTION:") {
    // Iterate over each line to find the target key
    for (let line of lines) {
      if (line.includes(targetKey)) {
        targetValue = line
          .substring(line.indexOf(targetKey) + targetKey.length)
          .trim();
        break;
      }
    }
  } else {
    // Iterate over each line to find the target key
    for (let line of lines) {
      if (line.trim().includes(targetKey)) {
        targetValue = line.trim().substring(targetKey.length).trim();
        break;
      }
    }
  }

  return targetValue;
}

export default formCommand;
