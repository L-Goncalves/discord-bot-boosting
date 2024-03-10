// form.js
import { Client } from "discord.js";
import { verificationCard } from "../Functions/main.js";
/**
 * @type {import("../index.js").PrefixCommand}
 */
const formCommand = {
  name: "form",
  description: "form command",
  /**
   * @param {Client} client
   */
  execute: async (client, message, args) => {
    try {
      const formData = args.join(" ");

      const commandsChannel = message.channel.name.toLowerCase() === "commands";

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
        /ORDER DESCRIPTION: (.+?)\n/
      ).toUpperCase();
      const role = extractValue(formData, /ROLE: (.+?)\n/).toUpperCase();
      const price = extractValue(formData, /PRICE: (.+?)\n/);
      const email = extractValue(formData, /EMAIL: (.+?)\n/);
      const password = extractValue(formData, /PASSWORD: (.+?)\n/);
      const time = extractValue(formData, /TIME: (.+?)\n/);
      const extra = extractValue(formData, /EXTRA: (.+?)\n/);
      const booster = extractValue(formData, /BOOSTER: (.+?)\n/);
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
        message.reply(
          "Por favor, preencha valores válidos de role: 'DPS', 'SUPPORT' ou 'TANK'"
        );
        return;
      }

      if (fields.description.includes("NOT FOUND")) {
        message.reply("Por favor, preencha uma descrição.");
        return;
      }

      if (!fields.email.includes("@")) {
        message.reply(
          "Por favor, preencha valor válido de email. (Não contém @)"
        );
        return;
      }

      if (!fields.price.includes("R$")) {
        message.reply(
          "Por favor, preencha valor válido de preço. Deve conter R$."
        );
        return;
      }

      const user = message.guild.members.cache.find(
        (member) => member.user.tag === fields.booster
      );

      if (!user) {
        message.reply(
          "Por favor, preencha valor válido de usuário. (É o nome de usuário do discord e não nickname)"
        );
        return;
      }

      verificationCard(client, message, fields);

      return;
    } catch (error) {
      console.error("Error executing form command:", error);
      return;
    }
  },
};

function extractValue(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : "Not found";
}

export default formCommand;
