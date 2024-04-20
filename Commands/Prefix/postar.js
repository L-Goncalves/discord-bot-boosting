// form.js
import { Client } from "discord.js";
import { verificationCard } from "../Functions/main.js";
/**
 * @type {import("../index.js").PrefixCommand}
 */
const formCommand = {
  name: "postar",
  description: "form command",
  /**
   * @param {Client} client
   */
  execute: async (client, message, args) => {
    try {
      const fetchedMessages = await message.channel.messages.fetch({
        limit: 1,
        before: message.id,
      });

      const lastMsg = await fetchedMessages.last();

      if (!lastMsg) {
        const msg = await message.reply("Mensagem de !boost não encontrado.");

        setTimeout(async () => {
          await message.delete();
          await msg.delete();
        }, 500);
        return;
      }

      const formData = lastMsg.content;

      const commandsChannel =
        message.channel.name.toLowerCase() === "⚫┃anunciador";

      if (!commandsChannel) {
        const msg = await message.reply(
          "Este comando só pode ser executado no canal #commands."
        );

        await message.delete();

        setTimeout(async () => {
          await msg.delete();
        }, 5000);

        return;
      }

      // Use regular expressions to extract information
      const description = extractValue(
        formData,
        "ORDER DESCRIPTION:"
      ).toUpperCase();
      const role = extractValue(formData, "ROLE:").toUpperCase();
      const time = extractValue(formData, "TIME:");
      const price = extractValue(formData, "PRICE:");
      const email = extractValue(formData, "EMAIL:");
      const password = extractValue(formData, "PASSWORD:");
      const extra = extractValue(formData, "EXTRA:");

      let booster = extractValue(formData, "BOOSTER:");

      if (booster.length === 0) {
        booster = "Not found";
      }
      const fields = {
        description,
        role,
        price,
        email,
        password,
        time,
        extra,
        booster,
      };

      if (!["DPS", "TANK", "SUPPORT"].includes(fields.role)) {
        const msg = await message.reply(
          "Por favor, preencha valores válidos de role: 'DPS', 'SUPPORT' ou 'TANK'"
        );

        setTimeout(async () => {
          await msg.delete();
          await message.delete();
          if (lastMsg) {
            await lastMsg.delete();
          }
        }, 3000);
        return;
      }

      if (fields.description.includes("NOT FOUND")) {
        const msg = await message.reply("Por favor, preencha uma descrição.");

        setTimeout(async () => {
          if (lastMsg) {
            await lastMsg.delete();
          }
          await msg.delete();
          await message.delete();
        }, 3000);
        return;
      }

      if (!fields.email.includes("@")) {
        const msg = await message.reply(
          "Por favor, preencha valor válido de email. (Não contém @)"
        );

        setTimeout(async () => {
          if (lastMsg) {
            await lastMsg.delete();
          }
          await msg.delete();
          await message.delete();
        }, 3000);
        return;
      }

      // if (!fields.price.includes("R$")) {
      //   message.reply(
      //     "Por favor, preencha valor válido de preço. Deve conter R$."
      //   );
      //   return;
      // }

      const user = message.guild.members.cache.find(
        (member) => member.user.tag === fields.booster
      );

      if (!user && !fields.booster.includes("Not found")) {
        const msg = await message.reply(
          "Por favor, preencha valor válido de usuário. (É o nome de usuário do discord e não nickname)"
        );

        setTimeout(async () => {
          await msg.delete();
          await message.delete();
        }, 3000);
        return;
      }

      await verificationCard(client, message, fields);

      setTimeout(async () => {
        await lastMsg.delete();
        await message.delete();
      }, 10000);
      return;
    } catch (error) {
      console.error("Error executing form command:", error);
      return;
    }
  },
};

function extractValue(text, targetKey) {
  const lines = text.split("\n");
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
      if (line.startsWith(targetKey)) {
        targetValue = line.substring(targetKey.length).trim();
        break;
      }
    }
  }

  return targetValue;
}

export default formCommand;
