import LoginModel from '../model/LoginModel';
import LoginView from '../view/LoginView.js';

export default class LoginPresenter {
  constructor() {
    this.model = new LoginModel();
    this.view = new LoginView();
  }

  init() {
    this.view.render(async (email, pass) => {
      try {
        await this.model.login(email, pass);
        this.view.showLoginSuccess();
      } catch (err) {
        console.error(err);
        this.view.showLoginError(err.message);
      }
    });
  }
}