import { makeAutoObservable } from "mobx";
import { Message } from "../components/Chat/index";

class NOUSDataStore {
  private _messages: Message[] = [];

  constructor() {
    console.log("NOUSDataStore constructor");
    makeAutoObservable(this);
  }

  set messages(newMessages: Message[]) {
    this._messages = newMessages;
  }

  get messages() {
    return this._messages;
  }

  addMessage = (role: 'user' | 'assistant', content: string) => {
    this._messages = [...this._messages, { role, content }];
  }

  addMessages = (newMessages: Message[]) => {
    // check if message already exists first
    if (this.messages.some((message) => message.content === newMessages[0].content)) {
      console.log("message already exists");
      return;
    }
    this.messages = [...this.messages, ...newMessages];
  }

  clearMessages = () => {
    this._messages = [];
  }
}

export default NOUSDataStore;