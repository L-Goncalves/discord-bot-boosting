// form.js
import { Client, ChannelType, EmbedBuilder } from "discord.js";
import {
  decryptPassword,
  submitBoostToChannel,
  verificationCard,
} from "../Functions/main.js";
/**
 * @type {import("../index.js").PrefixCommand}
 */
const formCommand = {
  name: "negar",
  description: "negar um boost",
  /**
   * @param {Client} client
   */
  execute: async (client, message, args) => {
    try {
      console.log("running");
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
          content: `Boost #${boostID} não encontrado!`,
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
          content: `<@${user.id}>, Você não pode negar o Boost que é de outro usuário.`,
        });

        setTimeout(async () => {
          await msg.delete();
          await message.delete();
        }, 5000);

        return;
      }

      if (!boostID) {
        const msg = await message.reply(
          "Por favor, forneça o ID do boost para negar o boost."
        );

        setTimeout(async () => {
          await msg.delete();
          await message.delete();
        }, 3000);

        return;
      }

      if (boostID.includes("#")) {
        const msg = message.reply(
          "Por favor, forneça apenas os números do ID do boost.\n \n**Exemplo: !aceitar 999999**"
        );

        setTimeout(async () => {
          await msg.delete();
          await message.delete();
        }, 3000);
        return;
      }

      if (matchedMessageWithEmbed) {
        try {
          const guild = client.guilds.cache.get(message.guildId);

          const boostHistoryId = guild.channels.cache.find(
            (c) => c.name === "📖┃histórico" && c.type === ChannelType.GuildText
          ).id;

          const logChannelId = guild.channels.cache.find(
            (c) => c.name === "💻┃dados" && c.type === ChannelType.GuildText
          ).id;

          const logChannel = client.channels.cache.get(logChannelId);

          const boostHistory = client.channels.cache.get(boostHistoryId);

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
            .setTitle(`Boost Rejeitado ❌`)
            .setDescription(
              `
                ${`**Código do Boost**: #${boostID}`}
                ${`**Boost Negado por**: ${user}`}
                **Role**: ${fields.role}
                ${fields.price ? `**Valor**: ${fields.price}` : ``}
                **Descrição Rank**: ${fields.description}
                **Email**: ${decryptPassword(fields.email)}
                **Data**: ${datetime}
                  `
            );

          boostHistory.send({ embeds: [boostHistoryEmbed] });

          if (
            fields.booster.toUpperCase().includes("Not Found") ||
            !fields.booster ||
            fields.booster.toUpperCase().includes("NOT FOUND") ||
            fields.booster.includes("NOTFOUND")
          ) {
            await submitBoostToChannel(client, guild, fields);
          }

          await matchedMessageWithEmbed.delete();
          await message.delete();
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

  console.log(lastFetchedMessage.id);
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
export default formCommand;
