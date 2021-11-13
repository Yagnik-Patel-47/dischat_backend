import { gql } from "apollo-server-express";

const typeDefs = gql`
  type Message {
    message: String!
    timestamp: String!
    sender: String!
    chatId: ID!
  }

  type Chat {
    users: [User!]!
    _id: ID!
    messages: [Message]!
    name: String!
  }

  type User {
    username: String!
    email: String!
    chats: [String!]!
    _id: ID!
  }

  type Error {
    message: String!
  }

  type UserRes {
    user: User
    error: Error
  }

  type Query {
    getUser(email: String!): UserRes
    getUserByID(Id: ID!): UserRes
    findUserByUsername(username: String!): UserRes
    getChat(id: ID!): Chat
    getAllChats: [Chat]!
  }

  input UserInput {
    username: String!
    email: String!
    _id: ID!
  }

  type Mutation {
    createNewUser(email: String!, username: String!): User
    createNewChat(users: [UserInput!]!, name: String!): Chat
    newMessage(
      message: String!
      timestamp: String!
      sender: String!
      chatId: ID!
    ): Message!
    deleteMessage(chatId: ID!, index: Int!): Boolean!
    addNewUserToChat(chatId: ID!, user: UserInput!): Boolean!
    leaveChat(userId: ID!, chatId: ID!): Boolean!
  }

  type DeleteMessageRes {
    message: Message!
    index: Int!
  }

  type newChatRes {
    userId: ID!
    chatId: ID!
  }

  type Subscription {
    newMessage(chatId: ID!): Message!
    deleteMessage(chatId: ID!): DeleteMessageRes
    newChat(userId: ID!): newChatRes
  }
`;

export default typeDefs;
