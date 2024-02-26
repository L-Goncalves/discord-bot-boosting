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
      if (message.content.includes(roleToSearch)) {
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

    const customData = retrieveData(client, `sorteioboost2_${id}`);

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
      name: `boost-${user.username}-${id}`,
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
        `Boost ${fields.get("role").value.toUpperCase()} / ${fields
          .get("descricao")
          .value.toUpperCase()} | #${id}`
      )
      .setDescription(
        `Bem vindo o seu boost foi iniciado ${
          user.username
        }! \nInformações do Boost:

    Descrição: ${fields.get("descricao").value.toUpperCase()}
    Role: ${fields.get("role").value.toUpperCase()}
    Valor a ser pago: R$${fields.get("preco").value.toUpperCase()}
    Extra: ${fields.get("extras").value.toUpperCase()}


    Acesso da Conta: 

    Email: ${customData.get("email").value}
    Senha: ${customData.get("senha").value}


   ${RULE_TEXT}
      `
      )

      // .setImage("https://i.imgur.com/AfFp7pu.png")
      .setTimestamp()
      .setFooter({
        text: `Você tem ${fields
          .get("timeToDoIt")
          .value.toUpperCase()} horas para completar esse boost e receber o valor.`,
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

  const roleName = fields?.get("role").value.toUpperCase();

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

  const role = fields?.get("role").value.toUpperCase();

  if (!role) {
    return new Error(
      "Preencha novamente o formulário, o BOT foi reiniciado.  "
    );
  }

  let winner = await chooseAndReroll(logChannel, role, possibleWinners);

  const winnerUser = guild.members.cache.find(
    (member) => member.user.username === winner
  );
  const mentionUser = winnerUser ? `<@${winnerUser.user.id}>` : winner;
  const description = descriptionBuilder(mentionUser, fields);

  const exampleEmbed = new EmbedBuilder()
    .setColor(0x9747ff)
    .setTitle(
      `Boost ${fields.get("role").value.toUpperCase()} / ${fields
        .get("descricao")
        .value.toUpperCase()} | #${id}`
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

    await sentMessage.react("✅");
    await sentMessage.react("❌");
    // await sentMessage.react("🚫");

    // Listen for reactions
    const filter = (reaction, user) => {
      const mentionedUserId = mentionUser.replace(/[<@!>]/g, "");

      return (
        ["✅", "❌"].includes(reaction.emoji.name) &&
        user.id === mentionedUserId
      );
    };

    const collector = sentMessage.createReactionCollector({
      filter,
      time: 30 * 60 * 1000,
    });

    collector.on("collect", async (reaction, user) => {
      console.log(`Reaction collected: ${reaction.emoji.name} by ${user.tag}`);

      if (reaction.emoji.name === "✅") {
        console.log(`Creating custom channel for ${user.tag}`);
        sentMessage.delete();
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

      if (reaction.emoji.name === "❌") {
        sentMessage.delete();

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

      if (reaction.emoji.name === "🚫") {
        console.log("Cancel Boost");
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        sentMessage.delete();
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
      content: `\`\`\`json\n{ "latestWinner": "${winner}", "role": "${fields
        .get("role")
        .value.toUpperCase()}", "listOfWinners": ${JSON.stringify(
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

export async function verificationCard(client, interaction) {
  let randomID = 0;

  if (interaction.customId && interaction.customId.includes("sorteioboost1")) {
    randomID = interaction.customId.split("_")[1];
  }

  if (!interaction.customId) {
    randomID = generateRandomID();

    const reply = await interaction.reply({ content: "Criando Formulário..." });

    // await new Promise((resolve) => setTimeout(resolve, 5000));
    reply.delete();
  }

  let components = [
    {
      type: 1,
      components: [
        {
          style: 1,
          label: `Começar a preencher #${randomID}`,
          custom_id: `send-firstpage_${randomID}`,
          disabled: false,
          type: 2,
        },
      ],
    },
  ];

  let description = descriptionBuilder("@sorteado");

  let embeb = new EmbedBuilder()
    .setColor(0x9747ff)
    .setTitle(`Boost - RANK INICIAL - RANK FINAL / ROLE | #${randomID}`)
    .setDescription(description)

    // .setImage("https://i.imgur.com/AfFp7pu.png")
    .setTimestamp();
  // .setFooter({
  //   text: "Reaja com ✅ para para aceitar o Boost ou com ❌ para negar.",
  // });

  const channel = client.channels.cache.get(interaction.channelId);

  if (interaction.customId && interaction.customId.includes("sorteioboost1")) {
    interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
    let description = descriptionBuilder("", interaction.fields.fields);

    embeb = new EmbedBuilder()
      .setColor(0x9747ff)
      .setTitle(
        `Boost - ${interaction.fields.fields
          .get("descricao")
          .value.toUpperCase()} / ${interaction.fields.fields
          .get("role")
          .value.toUpperCase()} | #${randomID}`
      )
      .setDescription(description)

      // .setImage("https://i.imgur.com/AfFp7pu.png")
      .setTimestamp();
    // .setFooter({
    //   text: "Reaja com ✅ para para aceitar o Boost ou com ❌ para negar.",
    // });

    storeData(client, interaction.customId, interaction.fields.fields);

    components = [
      {
        type: 1,
        components: [
          {
            style: 3,
            label: "Continuar Preenchendo",
            custom_id: `send-secondpage_${randomID}`,
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
  }

  if (interaction.customId && interaction.customId.includes("sorteioboost2")) {
    randomID = interaction.customId.split("_")[1];

    interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
    const previousData = retrieveData(client, `sorteioboost1_${randomID}`);

    let description = descriptionBuilder(
      "",
      previousData,
      interaction.fields.fields
    );

    storeData(client, `sorteioboost2_${randomID}`, interaction.fields.fields);

    components = [
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
          // {
          //   style: 1,
          //   label: "Editar Email / Senha",
          //   custom_id: "edit-email",
          //   disabled: false,
          //   type: 2,
          // },
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

    if (!previousData) {
      return;
    }

    embeb = new EmbedBuilder()
      .setColor(0x9747ff)
      .setTitle(
        `Boost - ${previousData
          .get("descricao")
          .value.toUpperCase()} / ${previousData
          .get("role")
          .value.toUpperCase()} | #${randomID}`
      )
      .setDescription(description)

      // .setImage("https://i.imgur.com/AfFp7pu.png")
      .setTimestamp();
    // .setFooter({
    //   text: "Reaja com ✅ para para aceitar o Boost ou com ❌ para negar.",
    // });
  }

  if (interaction.customId) {
    sendVerificationCard(channel, "", components, [embeb], randomID);
  } else {
    sendVerificationCard(channel, "", components, [embeb]);
  }
}
