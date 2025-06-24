// import RegisterView from '../view/RegisterView.js';

// export default class RegisterPresenter {
//   constructor(model) {
//     this.model = model;
//     this.view = new RegisterView();
//   }

//   init() {
//     this.view.render(async (name, email, password) => {
//       try {
//         const res = await this.model.register(name, email, password);
//         alert(`Registrasi berhasil! Selamat datang, ${res.name}. Silakan login.`);
//         location.hash = '/login';
//       } catch (err) {
//         alert(`Gagal registrasi: ${err.message}`);
//       }
//     });
//   }
// }


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
        alert(`Registrasi berhasil! Selamat datang, ${res.name}. Silakan login.`);
        location.hash = '/login';
      } catch (err) {
        alert(`Gagal registrasi: ${err.message}`);
      }
    });
  }
}
