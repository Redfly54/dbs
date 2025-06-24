import RegisterModel from '../model/RegisterModel';
import RegisterView from '../view/RegisterView.js';

export default class RegisterPresenter {
  constructor() {
    this.model = new RegisterModel();  // Use the RegisterModel
    this.view = new RegisterView();
  }

  init() {
    this.view.render(async (name, email, password) => {
      try {
        const res = await this.model.register(name, email, password);
        this.view.showRegisterSuccess(res.name);
      } catch (err) {
        this.view.showRegisterError(err.message);
      }
    });
  }
}