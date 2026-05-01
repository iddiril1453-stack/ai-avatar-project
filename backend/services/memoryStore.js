const users = {};

export function getUser(userId) {
  if (!users[userId]) {
    users[userId] = {
      history: [],
      intent: "cold"
    };
  }
  return users[userId];
}

export function addMessage(userId, role, content) {
  users[userId].history.push({ role, content });

  // max 20 mesaj
  if (users[userId].history.length > 20) {
    users[userId].history.shift();
  }
}

export function setIntent(userId, intent) {
  users[userId].intent = intent;
}