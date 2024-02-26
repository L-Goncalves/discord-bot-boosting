import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";
import { verificationCard } from "../../Functions/main.js";

export default {
  name: "sortearboost",
  description: "Realize um sorteio de um boost",
  userPermissions: PermissionFlagsBits.SendMessages,
  botPermissions: PermissionFlagsBits.SendMessages,
  category: "Misc",
  type: ApplicationCommandType.ChatInput,

  run: async (client, interaction) => verificationCard(client, interaction),
};
