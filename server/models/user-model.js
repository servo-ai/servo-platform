class UserModel {
  constructor(name, email, facebookID, githubID, projectsDir, lastLoggedIn, created, _id) {
    this.name = name;
    this.email = email;
    this.id = this.facebookID = facebookID;
    this.githubID = githubID;
    this.created = created;
    this.lastLoggedIn = lastLoggedIn;
    this._id = _id;
    this.projectsDir = projectsDir || this._id || UserModel.anonymousFolder();

  }

  static create(obj) {
    return new UserModel(obj.name, obj.email, obj.facebookID, obj.githubID, obj.projectsDir, obj.lastLoggedIn, obj.created, obj._id);
  }

  static anonymousFolder() {
    return "anonymous";
  }
}
module.exports = UserModel;
