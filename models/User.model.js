import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  chats: { type: [String], default: [] },
});

const User = new model("user", userSchema);
export default User;
