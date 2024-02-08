
export function pickWinner(participants) {
  if (participants.length > 0) {
    const winnerIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[winnerIndex];
     

    return winner;
  } else {
    console.log('No participants to pick a winner from.');
    return null
  }
}

export async function getLatestWinner(logChannel, roleToSearch) {
    try {
      // Fetch the latest messages from the channel
      const messages = await logChannel.messages.fetch({ limit: 10 }); // You can adjust the limit as needed
  
      // Iterate through the fetched messages
      for (const [_, message] of messages) {
        // Check if the message contains the desired role
        if (message.content.includes(roleToSearch)) {
          // Parse the content to extract the latest winner
          const match = /"lastestWinner": "(.*?)"/.exec(message.content);
          const latestWinner = match ? match[1] : null;
  
          if (latestWinner) {
            console.log(`Latest winner for role ${roleToSearch}: ${latestWinner}`);
            return latestWinner;
          }
        }
      }
  
      console.log(`No winner found for role ${roleToSearch}`);
      return null;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return null;
    }
}
  
export async function chooseAndReroll(logChannel, role, possibleWinners) {
    console.log(possibleWinners)
    let winner = await pickWinner(possibleWinners);
    const lastWinner = await getLatestWinner(logChannel, role);
  
    if (lastWinner === winner) {
      console.log('Rerolling winner...');
      return chooseAndReroll(logChannel, role, possibleWinners); // Recursively call the function to reroll
    } else {
      console.log('Winner is different from the last one.');
      return winner;
    }
  }

  
