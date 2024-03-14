import {
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  ActionRowBuilder,
} from "discord.js";
import { RULE_TEXT, descriptionBuilder } from "./consts.js";

export function pickWinner(participants, indexOfLastWinner = -1) {
  if (participants.length > 0) {
    let winnerIndex = indexOfLastWinner + 1;
    let winner = participants[winnerIndex];
    // if out of bonds
    if (!participants[winnerIndex]) {
      winner = participants[0];
    }

    // winnerIndex = indexOfLastWinner;
    // ? indexOfLastWinner + 1
    // : Math.floor(Math.random() * participants.length);

    return winner;
  } else {
    console.log("No participants to pick a winner from.");
    return null;
  }
}

export async function getLatestWinnerData(logChannel, roleToSearch) {
  try {
    // Fetch the latest messages from the channel
    const messages = await logChannel.messages.fetch({ limit: 30 }); // You can adjust the limit as needed

    // Iterate through the fetched messages
    for (const [_, message] of messages) {
      // Check if the message contains the desired role
      if (
        message.content.includes(roleToSearch) &&
        message.content.includes("false")
      ) {
        // Parse the content to extract the latest winner
        const match = /"latestWinner": "(.*?)"/.exec(message.content);
        const latestWinner = match ? match[1] : null;

        if (latestWinner) {
          return [
            latestWinner,

            JSON.parse(
              message.content.replace("```json", "").replace("```", "")
            ),
          ];
        }
      }
    }

    console.log(`No winner found for role ${roleToSearch}`);
    return [null, null];
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [null, null];
  }
}

export async function chooseAndReroll(logChannel, role, possibleWinners) {
  const [lastWinner, data] = await getLatestWinnerData(logChannel, role);

  let winner;

  if (data) {
    winner = await pickWinner(possibleWinners, data?.indexOfLastWinner);
  } else {
    winner = await pickWinner(possibleWinners);
  }

  console.log(lastWinner, winner);

  return winner;
  // if (lastWinner === winner) {
  //   console.log("Rerolling winner...");
  //   return chooseAndReroll(logChannel, role, possibleWinners); // Recursively call the function to reroll
  // } else {
  //   console.log("Winner is different from the last one.");
  //   return winner;
  // }
}

export async function createCustomChannel(
  user,
  targetChannel,
  fields,
  client,
  interaction
) {
  try {
    // Create a category for the custom channels if it doesn't exist

    const id = interaction.customId ? interaction.customId.split("_")[1] : 0;

    let category = targetChannel.guild.channels.cache.find(
      (c) => c.name === "Boosts Ativos" && c.type === ChannelType.GuildCategory
    );
    if (!category) {
      category = await targetChannel.guild.channels.create({
        name: "Boosts Ativos",
        type: ChannelType.GuildCategory,
      });
    }

    // Create a custom channel for the user
    const customChannel = await targetChannel.guild.channels.create({
      name: `${user.username}-${fields.description}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: targetChannel.guild.id, // @everyone
          deny: PermissionFlagsBits.ViewChannel,
        },
        {
          id: user.id, // The user who accepted the boost
          allow: PermissionFlagsBits.ViewChannel,
        },
      ],
    });

    const infoEmbeb = new EmbedBuilder()
      .setColor(0x9747ff)
      .setTitle(
        `Boost ${fields.role.toUpperCase()} / ${fields.description.toUpperCase()} | #${id}`
      )
      .setDescription(
        `Bem vindo o seu boost foi iniciado ${
          user.username
        }! \nInformações do Boost:

    Descrição: ${fields.description.toUpperCase()}
    Role: ${fields.role.toUpperCase()}
    Valor a ser pago: R$${fields.price.toUpperCase()}
    Extra: ${fields.extra.toUpperCase()}


    Acesso da Conta: 

    Email: ${fields.email}
    Senha: ${fields.password}


   ${RULE_TEXT}
      `
      )

      // .setImage("https://i.imgur.com/AfFp7pu.png")
      .setTimestamp()
      .setFooter({
        text: `Você tem ${fields.time.toUpperCase()} horas para completar esse boost e receber o valor.`,
      });

    // Send a welcome message to the channel
    await customChannel.send({ embeds: [infoEmbeb] });

    console.log(`Custom channel created for ${user.username}`);
  } catch (error) {
    console.error("Error creating custom channel:", error);
  }
}

export async function handleBoostSubmit(interaction, customId) {
  const { guild } = interaction;

  const id = interaction.customId ? interaction.customId.split("_")[1] : 0;

  const data = retrieveData(interaction.client, `sorteioboost1_${id}`);

  const fields = data;

  let possibleWinners = [];

  const roleName = fields?.role.toUpperCase();

  const roleFound = guild.roles.cache.find(
    (role) => role.name.toUpperCase() === roleName
  );

  if (roleFound) {
    const members = roleFound.members.map((member) => member.user.username);

    possibleWinners = [...members];
  } else {
    console.log(`Role "${roleName}" not found.`);
  }

  const targetChannelId = guild.channels.cache.find(
    (c) => c.name === "boosts" && c.type === ChannelType.GuildText
  ).id;
  const logChannelId = guild.channels.cache.find(
    (c) => c.name === "logs" && c.type === ChannelType.GuildText
  ).id;

  const logChannel = interaction.client.channels.cache.get(logChannelId);

  const role = fields.role.toUpperCase();

  if (!role) {
    return new Error(
      "Preencha novamente o formulário, o BOT foi reiniciado.  "
    );
  }
  let winner;

  if (!fields.booster.includes("Not found")) {
    winner = fields.booster;
  } else {
    winner = await chooseAndReroll(logChannel, role, possibleWinners);
  }

  const winnerUser = guild.members.cache.find(
    (member) => member.user.username === winner
  );

  const isAdmin = interaction.member.permissions.has("ADMINISTRATOR");

  const mentionUser = winnerUser ? `<@${winnerUser.user.id}>` : winner;
  const description = descriptionBuilder(mentionUser, fields);

  const exampleEmbed = new EmbedBuilder()
    .setColor(0x9747ff)
    .setTitle(
      `Boost ${fields.role.toUpperCase()} / ${fields.description.toUpperCase()} | #${id}`
    )
    .setDescription(description)

    .setImage("https://i.imgur.com/9akxla2.png")
    .setTimestamp()
    .setFooter({
      text: "Reaja com ✅ para para aceitar o Boost ou com ❌ para negar.",
    });

  const targetChannel = interaction.client.channels.cache.get(targetChannelId);

  if (targetChannel) {
    const sentMessage = await targetChannel.send({
      content: mentionUser,
      embeds: [exampleEmbed],
    });

    let messageDeleted = false;

    await sentMessage.react("✅");
    await sentMessage.react("❌");
    await sentMessage.react("🚫");

    // Listen for reactions
    const filter = (reaction, user) => {
      return ["✅", "❌"].includes(reaction.emoji.name);
    };

    const filterAdmin = (reaction, user) => {
      return ["🚫"].includes(reaction.emoji.name);
    };

    const collector = sentMessage.createReactionCollector({
      filter,
      time: 30 * 60 * 1000,
    });

    const colletorAdmin = sentMessage.createReactionCollector({
      filterAdmin,
      time: 60 * 60 * 1000,
    });

    collector.on("collect", async (reaction, user) => {
      console.log(`Reaction collected: ${reaction.emoji.name} by ${user.tag}`);
      const mentionedUserId = mentionUser.replace(/[<@!>]/g, "");
      if (reaction.emoji.name === "✅" && user.id === mentionedUserId) {
        console.log(`Creating custom channel for ${user.tag}`);
        await sentMessage.delete();
        const boostAccepted = await targetChannel.send(
          `O boost foi aceito por ${user.tag} ✅`
        );

        setTimeout(() => {
          boostAccepted.delete();
        }, 5000);

        await createCustomChannel(
          user,
          targetChannel,
          fields,
          interaction.client,
          interaction
        ); // Pass the targetChannel
      }

      if (reaction.emoji.name === "❌" && user.id === mentionedUserId) {
        await sentMessage.delete();

        const boostRejected = await targetChannel.send(
          `O boost foi negado por ${user.tag}, realizando sorteio novamente.`
        );

        let dots = 0;

        const intervalId = setInterval(() => {
          dots++;
          const dotString = Array(dots).fill(".").join("");

          boostRejected.edit(
            `O boost foi negado por ${user.tag}, realizando sorteio novamente${dotString}`
          );

          if (dots >= 3) {
            dots = 0;
          }
        }, 1000);

        setTimeout(() => {
          clearInterval(intervalId);
          boostRejected.delete();
          handleBoostSubmit(interaction, customId);
        }, 5000);
      }

      if (reaction.emoji.name === "🚫" && isAdmin) {
        console.log("Cancel Boost");
      }
    });

    colletorAdmin.on("collect", async (reaction, user) => {
      if (reaction.emoji.name === "🚫" && isAdmin) {
        messageDeleted = true;
        await sentMessage.delete();
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0 && !isAdmin) {
        if (sentMessage && sentMessage.deletable & !messageDeleted) {
          await sentMessage.delete();
        }

        const boostRejected = await targetChannel.send(
          `O tempo expirou para aceitar ou negar o boost, realizando sorteio novamente...`
        );

        let dots = 0;

        const intervalId = setInterval(() => {
          dots++;
          const dotString = Array(dots).fill(".").join("");

          boostRejected.edit(
            `O tempo expirou para aceitar ou negar o boost, realizando sorteio novamente${dotString}`
          );

          if (dots >= 3) {
            dots = 0; // Reset dots after reaching a certain limit
          }
        }, 1000);

        // Set a timeout to delete the message and perform other actions after 5 seconds
        setTimeout(() => {
          clearInterval(intervalId); // Clear the interval
          boostRejected.delete();
          handleBoostSubmit(interaction, customId);
        }, 5000);
      }
    });

    logChannel.send({
      content: `\`\`\`json\n{ "latestWinner": "${winner}", "role": "${fields.role.toUpperCase()}", "isPickedByHand": ${!fields.booster
        .toUpperCase()
        .includes("NOT FOUND")},"listOfWinners": ${JSON.stringify(
        possibleWinners
      )}, "indexOfLastWinner": ${JSON.stringify(
        possibleWinners.indexOf(winner)
      )} }\n\`\`\``,
    });

    // await interaction.reply({ content: "Sorteio foi criado!" });
  } else {
    console.error(
      `Channel with ID ${targetChannelId} not found or not a text channel.`
    );
  }
}

export function generateRandomID() {
  const maxID = 999999; // Maximum 6-digit number
  return Math.floor(Math.random() * (maxID + 1));
}

export async function firstModal(client, interaction) {
  const ID = interaction.customId.split("_")[1];

  if (!interaction.member.permissions.has("ADMINISTRATOR")) {
    return await client.sendEmbed(
      interaction,
      "Você não tem permissão para realizar sorteios.",
      false
    );
  }

  const fields = {
    roleInput: new TextInputBuilder()
      .setCustomId("role")
      .setLabel("Qual a Role? (DPS, TANK, SUPPORT)")
      .setStyle(TextInputStyle.Short),
    description: new TextInputBuilder()
      .setCustomId("descricao")
      .setLabel("Descrição: (Bronze 5 - Champion 1)")
      .setStyle(TextInputStyle.Short),
    pricing: new TextInputBuilder()
      .setCustomId("preco")
      .setLabel("Qual é o preço que você vai pagar? (EX: 200 )")
      .setStyle(TextInputStyle.Short),
    extra: new TextInputBuilder()
      .setCustomId("extras")
      .setLabel("Itens extras:")
      .setStyle(TextInputStyle.Paragraph),
    timeToDoIt: new TextInputBuilder()
      .setCustomId("timeToDoIt")
      .setLabel("Tempo para realizar o boost (EX: 24HRS):")
      .setStyle(TextInputStyle.Short),
  };

  const modal = new ModalBuilder()
    .setCustomId(`sorteioboost1_${ID}`)
    .setTitle(`Sorteio de Boost | #${ID}`);

  // An action row only holds one text input,
  // so you need one action row per text input.
  const firstActionRow = new ActionRowBuilder().addComponents(
    fields.description
  );
  const secondActionRow = new ActionRowBuilder().addComponents(
    fields.roleInput
  );
  const thirdActionRow = new ActionRowBuilder().addComponents(fields.pricing);
  const fourthActionRow = new ActionRowBuilder().addComponents(fields.extra);
  const fifthActionRow = new ActionRowBuilder().addComponents(
    fields.timeToDoIt
  );

  // Add inputs to the modal
  modal.addComponents(
    firstActionRow,
    secondActionRow,
    thirdActionRow,
    fourthActionRow,
    fifthActionRow
  );

  await interaction.showModal(modal);
}

// Function to store data in the custom cache
function storeData(client, customId, data, key) {
  // Check if there is already an entry for the customId in the Map
  if (!client.customDataCache.has(customId)) {
    // If not, create a new Map to store data for this customId
    client.customDataCache.set(customId, new Map());
  }

  // Store the data associated with the key for the specific customId
  client.customDataCache.get(customId).set(key, data);
}

// Function to retrieve data from the custom cache
function retrieveData(client, customId, key) {
  // Check if there is an entry for the customId in the Map
  if (client.customDataCache.has(customId)) {
    // Retrieve the data associated with the key for the specific customId
    return client.customDataCache.get(customId).get(key);
  }

  // Return null or handle the case where data is not found
  return null;
}
export async function secondModal(client, interaction) {
  if (!interaction.member.permissions.has("ADMINISTRATOR")) {
    return await client.sendEmbed(
      interaction,
      "Você não tem permissão para realizar sorteios.",
      false
    );
  }

  const randomID = interaction.customId
    ? interaction.customId.split("_")[1]
    : 0;

  const fields = {
    email: new TextInputBuilder()
      .setCustomId("email")
      .setLabel("Qual o email da conta?")
      .setStyle(TextInputStyle.Short),
    senha: new TextInputBuilder()
      .setCustomId("senha")
      .setLabel("Qual a senha da conta?")
      .setStyle(TextInputStyle.Short),
  };

  const modal = new ModalBuilder()
    .setCustomId(`sorteioboost2_${randomID}`)
    .setTitle(`Sorteio de Boost | #${randomID}`);

  // An action row only holds one text input,
  // so you need one action row per text input.
  const firstActionRow = new ActionRowBuilder().addComponents(fields.email);
  const secondActionRow = new ActionRowBuilder().addComponents(fields.senha);

  // Add inputs to the modal
  modal.addComponents(firstActionRow, secondActionRow);

  await interaction.showModal(modal);
}

const sendVerificationCard = async (
  channel,
  content,
  components,
  embeds,
  boostID = null
) => {
  try {
    if (boostID) {
      const messages = await channel.messages.fetch({ limit: 10 });

      const messagesToEdit = await messages.filter((message) => {
        const embeds = message.embeds;

        if (embeds.length === 0) {
          return false;
        }

        return boostID === message.embeds[0].data.title.split("#")[1];
      });

      const messageToEdit = messagesToEdit.first();

      // console.log(messageToEdit.get(""));

      if (messageToEdit) {
        // Edit the specified message with the new content, components, and embeds
        await messageToEdit.edit({
          content: content || "",
          components: components || [],
          embeds: embeds || [],
        });
      } else {
        console.log("Message not found");
      }

      // Edit the specified message with the new content, components, and embeds

      return;
    }

    // If messageIdToEdit is not provided, send a new message
    await channel.send({
      content: content || "",
      tts: false,
      components: components || [],
      embeds: embeds || [],
    });
  } catch (error) {
    console.error("Error sending or editing verification card:", error);
  }
};

export async function deleteBoost(interaction, messageId) {
  try {
    const message = interaction.message;
    await message.delete();
  } catch (error) {
    console.error("Error deleting boost:", error);
    await interaction.reply("An error occurred while deleting the boost.");
  }
}

export async function verificationCard(client, message, fields) {
  const reply = await message.reply({ content: "Criando Formulário..." });

  // await new Promise((resolve) => setTimeout(resolve, 5000));
  reply.delete();

  const randomID = generateRandomID();

  storeData(client, `sorteioboost1_${randomID}`, fields);

  let components = [
    {
      type: 1,
      components: [
        {
          style: 1,
          label: "Enviar para #boosts",
          custom_id: `send-boosts_${randomID}`,
          disabled: false,
          type: 2,
        },
        {
          style: 1,
          label: "Apagar",
          custom_id: `delete-boost_${randomID}`,
          disabled: false,
          type: 2,
        },
        // {
        //   style: 1,
        //   label: "Editar Boost",
        //   custom_id: "edit-boost",
        //   disabled: false,
        //   type: 2,
        // },
      ],
    },
  ];

  const description = descriptionBuilder(
    fields.booster ? fields.booster : "sorteado",
    fields,
    fields
  );

  const embeb = new EmbedBuilder()
    .setColor(0x9747ff)
    .setTitle(`Boost - ${fields.description} | #${randomID}`)
    .setDescription(description)

    // .setImage("https://i.imgur.com/AfFp7pu.png")
    .setTimestamp();

  sendVerificationCard(message.channel, "", components, [embeb]);
}
