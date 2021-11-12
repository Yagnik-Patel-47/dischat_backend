import mongoose from "mongoose";
const { Schema, model } = mongoose;

const messageSchema = new Schema({
  message: { type: String, required: true },
  sender: { type: String, required: true },
  timestamp: { type: Date, required: true },
});

const chatSchema = new Schema({
  users: {
    type: [
      {
        username: { type: String, required: true },
        email: { type: String, required: true },
      },
    ],
    required: true,
  },
  messages: { type: [messageSchema], required: true, default: [] },
  name: { type: String, required: true },
});

export { chatSchema };

const Chat = new model("chat", chatSchema);
export default Chat;
