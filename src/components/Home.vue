<template>

  <div class="home">

    <div v-if="authenticated">

      <div class="form-group mt-3 mb-2">
        <div class="title clearfix">
          <h5 class="clearfix">Authenticated!</h5>
          <strong class="clearfix">Successfully connected to OBS!</strong>
          <VueLoadingButton
            @click.native="logout"
            type="submit"
            :styled="true"
            :loading="logoutLoading"
            class="save-btn btn btn-primary mt-1 pull-left mt-3"
            :disabled="logoutBtnDisabled">
          <span>Logout</span>
          </VueLoadingButton>
        </div>
      </div>

      <div class="form-group mt-3 mb-2">
        <div class="title clearfix">
          <label for="sences">
            <h5 class="clearfix">Active sence</h5>
            <small class="description">Select your active dota2 sence!</small>
          </label>
        </div>
        <ModelSelect 
                   id="sences"
                   :options="scenes"
                   v-model="selectedScene"
                   placeholder="select a sence" />
      </div>

      <div v-if="sceneItems.length > 0">

        <div class="form-group mt-3 mb-2">
          <div class="title clearfix">
            <label for="sence-item">
              <h5 class="clearfix">Draft cover</h5>
              <strong class="clearfix">
                This item will be visible when you're in drafting phase!
              </strong>
              <small class="clearfix">This sence item will be hide automaticlly when the game starts!</small>
            </label>
          </div>
          <ModelSelect 
                     id="sence-item"
                     :options="sceneItems"
                     v-model="selectedItem"
                     placeholder="select an item" />
        </div>

        <div class="form-group mt-3 mb-2">
          <div class="title clearfix">
            <label for="sence-in-game-item">
              <h5 class="clearfix">Mini-map cover</h5>
              <small class="clearfix">This sence item will be hide automaticlly when the game ends!</small>
            </label>
          </div>
          <ModelSelect 
                     id="sence-in-game-item"
                     :options="sceneItems"
                     v-model="selectedInGameItem"
                     placeholder="select an item" />
        </div>

      </div>

      <div v-if="sceneItems.length === 0 && selectedScene.value !== ''">
        This scene has no items!
      </div>

    </div>

    <div v-else>
      <div class="form-group mt-3 mb-2">
        <div class="title clearfix">
          <label for="auth_token">
            <h5 class="clearfix">Websocket port</h5>
            <strong class="description">OBS remote websocket port</strong>
          </label>
        </div>
        <input
          ref="websocketPort"
          id="websocketPort"
          class="form-control" 
          type="text"
          name="ws-port"
          placeholder="Port" 
          v-model="port"
          required />
      </div>

      <div class="form-group mt-3 mb-2"> 
        <div class="title clearfix">
          <label for="auth_token">
            <h5 class="clearfix">Password</h5>
            <strong class="description">OBS remote control password</strong>
          </label>
        </div>
        <input
          ref="tokenInput"
          id="auth_token"
          class="form-control" 
          type="password" 
          placeholder="Password" 
          v-model="password"
          autofocus 
          required />
      </div>

      <VueLoadingButton
        v-if="!noBtn"
        ref="saveBtn"
        @click.native="submit"
        type="submit"
        :styled="true"
        :loading="loading"
        class="save-btn btn btn-primary mt-1 full-width"
        :disabled="btnDisabled">
      <span>{{ btnName }}</span>
      </VueLoadingButton>

    </div>

  </div>

</template>

<style>

.form-group {
  background: #151414;
  padding: 20px;
  border-radius: 5px;
}

button.save-btn {
  padding: 3px 15px !important;
  font-size: 16px !important;
}

.pull-right {
  float: right;
}

.pull-left {
  float: left;
}

</style>

<script>

const OBSWebSocket = require('obs-websocket-js')
import { ModelSelect } from 'vue-search-select'
import VueLoadingButton from 'vue-loading-button'
const ipc = window.require('electron').ipcRenderer;

export default {
  name: "Home",
  components: {
    ModelSelect,
    VueLoadingButton,
  },
  data() {
    return {
      port: 4444,
      loading: false,
      logoutLoading: false,
      authenticated: false,

      btnDisabled: false,
      logoutBtnDisabled: false,

      noBtn: false,

      password: null,
      btnName: "Connect",

      selectedScene: {
        value: '',
        text: '',
        items: [],
      },
      scenes: [],
      selectedItem: {
        value: '',
        text: '',
      },
      selectedInGameItem: {
        value: '',
        text: '',
      },
      sceneItems: [],
    }
  },
  watch: {
    selectedItem: {
      deep: true,
      handler(item) {
        if (typeof item.value !== 'undefined') {
          localStorage.setItem("selected_item", item.value)
        }
      }
    },
    selectedInGameItem: {
      deep: true,
      handler(item) {
        if (typeof item.value !== 'undefined') {
          localStorage.setItem('selected_ingame_item', item.value)
        }
      }
    },
    selectedScene: {
      deep: true,
      handler(scene) {
        if (typeof scene.text !== 'undefined') {
          this.sceneItems = [];
          localStorage.setItem("selected_scene", scene.text)
          scene.sources.forEach(source => {
            this.sceneItems.push({
              value: source.id,
              text:  source.name,
              extra: source,
            })
          });
        }
      }
    },
  },
  methods: {

    onAuthorized() {
      const selectedSceneId = localStorage.getItem("selected_scene");
      if (selectedSceneId !== null) {
        let scene = this.scenes.find(f => f.text === selectedSceneId)
        if (scene !== undefined) {
          this.selectedScene = scene
        }
      }
      const selectedItemId = localStorage.getItem("selected_item");
      if (selectedItemId !== null) {
        let item = this.selectedScene.sources.find(f => f.id == selectedItemId)
        if (item !== undefined) {
          this.selectedItem = {
            value: item.id,
            text:  item.name,
            extra: item,
          }
        }
      }
      const selectedInGameItemId = localStorage.getItem("selected_ingame_item");
      if (selectedInGameItemId !== null) {
        let item = this.selectedScene.sources.find(f => f.id == selectedInGameItemId)
        if (item !== undefined) {
          this.selectedInGameItem = {
            value: item.id,
            text:  item.name,
            extra: item,
          }
        }
      }
      ipc.send('start-server', { 
        selectedItem: this.selectedItem,
        selectedInGameItem: this.selectedInGameItem,
        selectedScene: this.selectedScene,
      })
    },

    submit() {

      if (!this.authenticated) {

        this.loading = true
        this.btnDisabled = true
        this.$refs.tokenInput.disabled = true
        this.btnName = "Connecting..."

        const obs = new OBSWebSocket();

        ipc.on("toggle_drafting_cover", (_, {visible}) => {
          obs.send('SetSceneItemProperties', {
            'scene-name': this.selectedScene,
            'item': this.selectedItem.text,
            'visible': visible, 
          }).then(console.log).catch(console.log)
        })

        ipc.on("toggle_minimap_cover", (_, {visible}) => {
          obs.send('SetSceneItemProperties', {
            'scene-name': this.selectedScene,
            'item': this.selectedInGameItem.text,
            'visible': visible, 
          }).then(console.log).catch(console.log)
        })


        obs.connect({ address: `localhost:${this.port}`, password: this.password }).then(() => {
          this.btnName = "Connect";
          this.btnDisabled = false;
          this.$refs.tokenInput.disabled = false;
          this.loading = false;
          this.authenticated = true;
          console.log(`Success! We're connected & authenticated.`);
          localStorage.setItem('authorized', true)
          localStorage.setItem('port', this.port);
          localStorage.setItem('password', this.password);
          return obs.send('GetSceneList');
        }).then(data => {
          console.log(`${data.scenes.length} Available Scenes!`);
          console.log(data.scenes)
          data.scenes.forEach((scene, id) => {
            this.scenes.push({
              value: id,
              text: scene.name,
              sources: scene.sources,
            })
          });
          this.onAuthorized();
        }).catch(err => {
          if (err.status === "error") {
            if(err.code === "CONNECTION_ERROR") {
              this.btnName = "Connect"
              this.btnDisabled = false;
              this.$refs.tokenInput.disabled = false;
              this.loading = false;
              console.log("Connection Error!")
            }
            switch(err.error) {
              case "Authentication Failed.":
                this.btnName = "Connect";
                this.btnDisabled = false;
                this.$refs.tokenInput.disabled = false;
                this.loading = false;
                console.log("Authentication failed!")
                console.log(err);
                break;
            }
          }
        });

        obs.on('error', err => {
          console.error('Socket err', err);
        });

        //this.connectToStreamLabsObs().then(() => {
        //  this.btnName = "Connected! Gathering resources..."
        //  setTimeout(() => {
        //    this.loading = false
        //    this.authenticated = true
        //    this.noBtn = true
        //    localStorage.setItem("authorized", this.auth_token)
        //    this.onAuthorized()
        //  }, 2000);
        //}).catch(err => {
        //  switch (err.code) {
        //    case -32603:
        //      this.btnName = "Unauthorized!"
        //      setTimeout(() => {
        //        this.auth_token = null
        //        this.loading = false
        //        this.btnDisabled = false
        //        this.$refs.tokenInput.disabled = false
        //        this.btnName = "Connect"
        //      }, 2000);
        //      break;
        //    default:
        //      console.log("Could not connect!");
        //      break;
        //  }
        //});
      }
    },
    logout() {
      localStorage.removeItem("authorized")
      localStorage.removeItem("selected_item")
      localStorage.removeItem("selected_scene")
      localStorage.removeItem("selected_ingame_item")
      localStorage.removeItem("password")
      localStorage.removeItem("port")
      this.authenticated = false;
      this.selectedItem = {};
      this.selectedInGameItem = {};
      this.password = "";
      this.port = 4444;
      this.loading = false;
    }
  },
  mounted() {
    this.loading = true;
    const authenticated = localStorage.getItem("authorized")
    if (authenticated !== null) {
      this.auth_token = authenticated
      this.port = localStorage.getItem('port')
      this.password = localStorage.getItem('password')
      this.loading = false;
      this.submit()
    } else {
      this.loading = false;
    }
  }
}

</script>
