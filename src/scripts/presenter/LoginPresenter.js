// import LoginView from '../view/LoginView.js';

// export default class LoginPresenter {
//   constructor(model) {
//     this.model = model;
//     this.view = new LoginView();
//   }
//   init() {
//     this.view.render(async (email, pass) => {
//       try {
//         await this.model.login(email, pass);
//         alert('Login berhasil!');
//         location.hash = '/stories';
//       } catch (err) {
//         console.error(err);
//         alert(err.message);
//       }
//     });
//   }
// }


import LoginModel from '../model/LoginModel';
import LoginView from '../view/LoginView.js';

export default class LoginPresenter {
  constructor() {
    this.model = new LoginModel();  // Use the LoginModel
    this.view = new LoginView();
  }

  init() {
    this.view.render(async (email, pass) => {
      try {
        await this.model.login(email, pass);
        alert('Login berhasil!');
        location.hash = '/stories';
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });
  }
}
