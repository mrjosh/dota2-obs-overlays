import Vue from 'vue'
import App from './App.vue'
import routes from './routes'
import VueRouter from 'vue-router'
import Notifications from 'vue-notification'

Vue.config.productionTip = false

Vue.use(VueRouter);
Vue.use(Notifications);

import 'bootstrap/dist/js/bootstrap.min.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'vue-search-select/dist/VueSearchSelect.css'
import './assets/css/app.css'

const router = new VueRouter({
  mode: 'history',
  routes,
});

let application = new Vue({
  el: '#app',
  router: router,
  components: { App },
  template: '<App />'
});

export const bus = application;
