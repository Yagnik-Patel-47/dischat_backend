import User from "../models/User.model.js";
import Chat from "../models/Chat.model.js";
import { pubsub } from "../server.js";
import { withFilter } from "graphql-subscriptions";

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
  getAllChats: async () => {
    const foundChats = await Chat.find({});
    return foundChats;
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
      pubsub.publish("CHANGE_IN_CHAT", {
        newChat: { chatId: newChat._id, userId: user._id },
      });
    });
    return newChat;
  },
  newMessage: async (_parent, { message, sender, timestamp, chatId }) => {
    const foundChat = await Chat.findById(chatId);
    foundChat.messages.push({ message, sender, timestamp, chatId });
    foundChat.save();
    pubsub.publish("NEW_MESSAGE", {
      newMessage: { message, sender, timestamp, chatId },
    });
    return { message, sender, timestamp, chatId };
  },
  deleteMessage: async (_parent, { chatId, index }) => {
    const foundChat = await Chat.findById(chatId);
    const message = foundChat.messages[index];
    foundChat.messages.splice(index, 1);
    foundChat.save();
    pubsub.publish("DELETE_MESSAGE", { deleteMessage: { message, index } });
    return true;
  },
  addNewUserToChat: async (_parent, { chatId, user }) => {
    const foundChat = await Chat.findById(chatId);
    foundChat.users.push(user);
    foundChat.save();
    const dbuser = await User.findById(user._id);
    dbuser.chats.push(chatId);
    dbuser.save();
    pubsub.publish("CHANGE_IN_CHAT", { newChat: { chatId, userId: user._id } });
    return true;
  },
  leaveChat: async (_parent, { chatId, userId }) => {
    const foundChat = await Chat.findById(chatId);
    foundChat.users.forEach((user, currentIndex) => {
      if (user._id.toString() === userId) {
        foundChat.users.splice(currentIndex, 1);
        foundChat.save();
      }
    });
    const foundUser = await User.findById(userId);
    const remainingChats = foundUser.chats.filter((chat) => chat !== chatId);
    foundUser.chats = remainingChats;
    foundUser.save();
    pubsub.publish("CHANGE_IN_CHAT", { newChat: { chatId, userId } });
    return true;
  },
};

const Subscription = {
  newMessage: {
    subscribe: withFilter(
      () => pubsub.asyncIterator("NEW_MESSAGE"),
      (payload, variables) => {
        return payload.newMessage.chatId === variables.chatId;
      }
    ),
  },
  deleteMessage: {
    subscribe: withFilter(
      () => pubsub.asyncIterator("DELETE_MESSAGE"),
      (payload, variables) => {
        return payload.deleteMessage.message.chatId === variables.chatId;
      }
    ),
  },
  newChat: {
    subscribe: withFilter(
      () => pubsub.asyncIterator("CHANGE_IN_CHAT"),
      (payload, variables) => {
        return payload.newChat.userId === variables.userId;
      }
    ),
  },
};

const resolvers = {
  Query,
  Mutation,
  Subscription,
};

export default resolvers;
