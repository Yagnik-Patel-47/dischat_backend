import User from "../models/User.model.js";
import Chat from "../models/Chat.model.js";
import { pubsub } from "../server.js";

const Query = {
  getUser: async (_parent, { email }) => {
    const user = await User.findOne({ email: email }).exec();
    if (user === null) {
      return {
        error: {
          message: "User not found!",
        },
      };
    }
    return { user: user };
  },
  getUserByID: async (_parent, { Id }) => {
    const user = await User.findById(Id);
    if (user === null) {
      return {
        error: {
          message: "User not found!",
        },
      };
    }
    return { user: user };
  },
  findUserByUsername: async (_parent, { username }) => {
    const user = await User.findOne({ username }).exec();
    if (user === null) {
      return {
        error: {
          message: "User not found!",
        },
      };
    }

    return { user: user };
  },
  getChat: async (_parent, { id }) => {
    const foundChat = await Chat.findById(id);
    return foundChat;
  },
};

const Mutation = {
  createNewUser: async (_parent, { username, email }) => {
    const createdUser = await User.create({ username, email });
    return createdUser;
  },
  createNewChat: async (_parent, { users, name }) => {
    const newChat = await Chat.create({ users, name });
    users.forEach(async (user) => {
      const dbuser = await User.findById(user._id);
      dbuser.chats.push(newChat._id);
      dbuser.save();
    });
    return newChat;
  },
  newMessage: async (_parent, { message, sender, timestamp, chatId }) => {
    const foundChat = await Chat.findById(chatId);
    foundChat.messages.push({ message, sender, timestamp });
    foundChat.save();
    pubsub.publish("NEW_MESSAGE", {
      newMessage: { message, sender, timestamp },
    });
    return foundChat.messages;
  },
  deleteMessage: async (_parent, { chatId, index }) => {
    const foundChat = await Chat.findById(chatId);
    foundChat.messages.splice(index, 1);
    foundChat.save();
    pubsub.publish("DELETE_MESSAGE", {
      deleteMessage: foundChat.messages,
    });
    return true;
  },
  addNewUserToChat: async (_parent, { chatId, user }) => {
    const foundChat = await Chat.findById(chatId);
    foundChat.users.push(user);
    foundChat.save();
    const dbuser = await User.findById(user._id);
    dbuser.chats.push(chatId);
    dbuser.save();
    return true;
  },
};

const Subscription = {
  newMessage: {
    subscribe: () => pubsub.asyncIterator("NEW_MESSAGE"),
  },
  deleteMessage: {
    subscribe: () => pubsub.asyncIterator("DELETE_MESSAGE"),
  },
};

const resolvers = {
  Query,
  Mutation,
  Subscription,
};

export default resolvers;
