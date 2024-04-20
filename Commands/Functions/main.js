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
import crypto from "crypto";

const secretKey = "gim_goat"; // Make sure this is kept secret

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
}

export async function createCustomChannel(
  user,
  targetChannel,
  fields,
  client,
  interaction
) {
  try {
    const id = interaction
      ? interaction.customId
        ? interaction.customId.split("_")[1]
        : 0
      : fields.boostID;

    let category = targetChannel.guild.channels.cache.find(
      (c) =>
        c.name === "🔴▸⎾ Boosts Ativos⏌◂🔴" &&
        c.type === ChannelType.GuildCategory
    );
    if (!category) {
      category = await targetChannel.guild.channels.create({
        name: "🔴▸⎾ Boosts Ativos⏌◂🔴",
        type: ChannelType.GuildCategory,
      });
    }

    const channelName = `${user.username}-${fields.description}`;
    // Create a custom channel for the user

    const customChannel = await targetChannel.guild.channels.create({
      name: channelName,
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

    const getImageLink = (role) => {
      if (role.includes("DPS")) {
        return "https://i.imgur.com/o67m3Da.png";
      }
      if (role.includes("SUPPORT")) {
        return "https://i.imgur.com/wd5v9cD.png";
      }
      if (role.includes("TANK")) {
        return "https://i.imgur.com/6m1YvqW.png";
      }
    };

    console.log(fields);

    const infoEmbeb = new EmbedBuilder()
      .setColor(0x9747ff)
      .setTitle(
        `Boost ${fields.role.toUpperCase()} | ${fields.description.toUpperCase()}`
      )
      .setDescription(
        `Bem vindo ${
          user.username
        }, o seu boost foi iniciado!\n \n**Informações do Boost**:
    **Código do boost**: ${fields.boostID}
    **Descrição**: ${fields.description.toUpperCase()}
    **Role**: ${fields.role.toUpperCase()}
    ${
      fields.price
        ? `**Valor a ser pago**: R$${fields.price.toUpperCase()}`
        : ""
    }
    ${
      fields.extra &&
      !fields.extra.toUpperCase().includes("NOT FOUND") &&
      !fields.extra.toUpperCase().includes("NOTFOUND")
        ? `**Extra**: ${fields.extra.toUpperCase()}`
        : ""
    }


    **Acesso da Conta:**
    **Email**: ${decryptPassword(fields.email)}
    **Senha**: ${decryptPassword(fields.password)}



      `
      )

      .setImage(getImageLink(fields.role))
      .setTimestamp();
    // .setFooter({
    //   text: `${
    //     fields.time.toUpperCase().includes("NOT FOUND")
    //       ? `Você tem ${fields.time.toUpperCase()} horas para completar esse boost e receber o valor.`
    //       : "\n"
    //   }`,
    // });

    // Send a welcome message to the channel
    await customChannel.send({ embeds: [infoEmbeb] });

    console.log(`Custom channel created for ${user.username}`);
  } catch (error) {
    console.error(`Error creating channel:`, error);
  }
}

export async function submitBoostToChannel(client, guild, fields) {
  let possibleWinners = [];

  console.log(
    "BOOSTER:",
    fields.booster,
    fields.booster
      .toUpperCase()
      .trim()
      .includes("NOT FOUND" || "NOTFOUND")
  );

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
    (c) => c.name === "💰┃boosts " && c.type === ChannelType.GuildText
  ).id;
  const logChannelId = guild.channels.cache.find(
    (c) => c.name === "💻┃dados" && c.type === ChannelType.GuildText
  ).id;

  const logChannel = client.channels.cache.get(logChannelId);
  const targetChannel = client.channels.cache.get(targetChannelId);

  const role = fields.role.toUpperCase();

  let winner;

  if (!fields.booster.includes("Not found")) {
    winner = fields.booster;
  } else {
    winner = await chooseAndReroll(logChannel, role, possibleWinners);
  }

  const winnerUser = guild.members.cache.find(
    (member) => member.user.username === winner
  );

  // const isAdmin = imember.permissions.has("ADMINISTRATOR");
  const mentionUser = winnerUser ? `<@${winnerUser.user.id}>` : winner;
  console.log(fields);
  const description = descriptionBuilder(mentionUser, {
    ...fields,
    boostId: fields.boostID,
  });

  const getImageLink = (role) => {
    if (role.includes("DPS")) {
      return "https://i.imgur.com/o67m3Da.png";
    }
    if (role.includes("SUPPORT")) {
      return "https://i.imgur.com/wd5v9cD.png";
    }
    if (role.includes("TANK")) {
      return "https://i.imgur.com/6m1YvqW.png";
    }
  };

  const image = getImageLink(fields.role);
  console.log("imagem:", image, "role", fields.role);

  const exampleEmbed = new EmbedBuilder()
    .setColor(0x9747ff)
    .setTitle(
      `Boost ${fields.role.toUpperCase()} | ${fields.description.toUpperCase()}`
    )
    .setDescription(description)

    .setImage(image)
    .setTimestamp();

  const sentMessage = await targetChannel.send({
    content: mentionUser,
    embeds: [exampleEmbed],
  });
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
    (c) => c.name === "💰┃boosts" && c.type === ChannelType.GuildText
  ).id;
  const logChannelId = guild.channels.cache.find(
    (c) => c.name === "💻┃dados" && c.type === ChannelType.GuildText
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
  const description = descriptionBuilder(mentionUser, {
    ...fields,
    boostId: id,
  });
  // id
  const getImageLink = (role) => {
    if (role.includes("DPS")) {
      return "https://i.imgur.com/o67m3Da.png";
    }
    if (role.includes("SUPPORT")) {
      return "https://i.imgur.com/wd5v9cD.png";
    }
    if (role.includes("TANK")) {
      return "https://i.imgur.com/6m1YvqW.png";
    }
  };

  const image = getImageLink(fields.role);

  console.log("imagem:", image, "role", fields.role);

  const exampleEmbed = new EmbedBuilder()
    .setColor(0x9747ff)
    .setTitle(
      `Boost ${fields.role.toUpperCase()} | ${fields.description.toUpperCase()}`
    )
    .setDescription(description)

    .setImage(image)
    .setTimestamp();

  const targetChannel = interaction.client.channels.cache.get(targetChannelId);

  if (targetChannel) {
    const sentMessage = await targetChannel.send({
      content: mentionUser,
      embeds: [exampleEmbed],
    });

    logChannel.send({
      content: `\`\`\`json\n{ "latestWinner": "${winner}", "role": "${fields.role.toUpperCase()}", "isPickedByHand": ${!fields.booster
        .toUpperCase()
        .includes("NOT FOUND")},"listOfWinners": ${JSON.stringify(
        possibleWinners
      )}, "indexOfLastWinner": ${JSON.stringify(
        possibleWinners.indexOf(winner)
      )}, "boostID": ${id}, "email": "${hashAndEncryptPassword(
        fields.email
      )}", "password": "${hashAndEncryptPassword(
        fields.password
      )}",  ${Object.entries(fields)
        .filter(([key]) => key !== "password" && key !== "email")
        .map(([key, value]) => `"${key}": "${value}"`)
        .join(", ")}}\n\`\`\``,
    });

    // if(!interaction.replied){
    //   await interaction.reply({ content: "Enviado." });
    // }
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
    .setTitle(`Sorteio de Boost | ${ID}`);

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
    .setTitle(`Sorteio de Boost | ${randomID}`);

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
          label: "Enviar para #💰┃boosts",
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
    { ...fields, boostId: randomID },
    { ...fields, boostId: randomID }
  );

  const embeb = new EmbedBuilder()
    .setColor(0x9747ff)
    .setTitle(
      `Boost | ${
        fields.description
          ? fields.description + ` | ` + fields.role
          : fields.role
      }`
    )
    .setDescription(description)

    // .setImage("https://i.imgur.com/AfFp7pu.png")
    .setTimestamp();

  sendVerificationCard(message.channel, "", components, [embeb]);
}

// Function to hash and encrypt the password
export const hashAndEncryptPassword = (password) => {
  // Encrypt the password using a symmetric encryption algorithm (e.g., AES)
  const cipher = crypto.createCipher("aes-256-cbc", secretKey);
  let encryptedPassword = cipher.update(password, "utf8", "hex");
  encryptedPassword += cipher.final("hex");

  return encryptedPassword;
};

// Function to decrypt and verify the password
export const decryptPassword = (encryptedPassword) => {
  try {
    const decipher = crypto.createDecipher("aes-256-cbc", secretKey);
    let decryptedPassword = decipher.update(encryptedPassword, "hex", "utf8");
    decryptedPassword += decipher.final("utf8");

    return decryptedPassword;
  } catch (error) {
    console.error("Error decrypting password:", error);
    return null; // Return null or throw an error depending on your error handling strategy
  }
};
