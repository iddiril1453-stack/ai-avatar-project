const users = {};

export function getUser(userId) {
  if (!users[userId]) {
    users[userId] = {
      history: [],
      intent: "cold",
      lastMessage: "",
      createdAt: Date.now()
    };
  }

  return users[userId];
}

export function addMessage(userId, role, content) {
  const user = getUser(userId);

  user.history.push({ role, content });

  // son 10 mesaj
  user.history = user.history.slice(-10);

  user.lastMessage = content;
}

export function setIntent(userId, intent) {
  const user = getUser(userId);
  user.intent = intent;
}