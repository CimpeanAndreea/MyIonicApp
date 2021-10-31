import dataStore from 'nedb-promise'; //nosql db

export class UserStore {
  constructor({ filename, autoload }) {
    this.store = dataStore({ filename, autoload });
  }
  
  async findOne(props) {
    return this.store.findOne(props); //find one with certain properties
  }
  
  async insert(user) {
    return this.store.insert(user);
  };
}

//load users
export default new UserStore({ filename: './db/users.json', autoload: true });