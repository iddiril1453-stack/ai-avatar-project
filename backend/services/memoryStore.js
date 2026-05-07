const users = {};

export function getUser(userId) {
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      history: [],
      messageCount: 0,
      intent: "cold",
      stage: "cold",
      interestTags: []
    };
  }


  
  return users[userId];
}

export function addMessage(userId, role, content) {
  const user = getUser(userId);

  user.history.push({ role, content });
  user.messageCount++;

  // 🔥 memory limit (RAM koruma)
  if (user.history.length > 20) {
    user.history.shift();
  }

  // 🔥 simple intent auto update (çok önemli)
  if (user.messageCount > 10 && user.stage === "cold") {
    user.stage = "warm";
  }

  if (user.messageCount > 25) {
    user.stage = "hot";
  }
}

export function setIntent(userId, intent) {
  const user = getUser(userId);

  user.intent = intent;

  if (intent === "hot") user.stage = "hot";
  else if (intent === "warm") user.stage = "warm";
  else user.stage = "cold";
}

export function addInterest(userId, tag) {
  const user = getUser(userId);

  if (!user.interestTags.includes(tag)) {
    user.interestTags.push(tag);
  }
}