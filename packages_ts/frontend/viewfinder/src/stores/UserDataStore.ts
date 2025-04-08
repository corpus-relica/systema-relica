import { makeAutoObservable } from "mobx";



class UserDataStore {
  private _userID: number | null = null;

  constructor() {
    console.log("UserDataStore constructor");
    makeAutoObservable(this);
  }

  get UserID() {
    return this._userID;
  }

  set UserID(userID: number | null) {
    this._userID = userID;
  }
}

export default UserDataStore;
