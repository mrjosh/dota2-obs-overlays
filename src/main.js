import Vue from 'vue'
import App from './App.vue'
import routes from './routes'
import VueRouter from 'vue-router'

Vue.config.productionTip = false

Vue.use(VueRouter);

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
