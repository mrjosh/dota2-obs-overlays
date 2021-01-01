<template>

  <div class="home" v-show="ready">

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
          <span>Disconnect</span>
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
                   :options="scenes"
                   v-model="selectedScene"
                   :searchable="true"
                   @input="onSelectActiveScene"
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
                     :options="sceneItems"
                     v-model="draftCover"
                     @input="onSelectDraftCover"
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
                     :options="sceneItems"
                     @input="onSelectedMinimap"
                     v-model="minimapCover"
                     placeholder="select an item" />
        </div>

      </div>

      <div v-if="sceneItems.length === 0">
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
          v-model="config.port"
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
          v-model="config.password"
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

      ready: false,
      config: {
        port: 4444,
        password: "",
        scene: "",
        covers: {
          draft: '',
          minimap: '',
        }
      },

      loading: false,
      logoutLoading: false,
      authenticated: false,

      btnDisabled: false,
      logoutBtnDisabled: false,

      noBtn: false,
      btnName: "Connect",

      selectedScene: {
        value: '',
        text: '',
      },
      
      scenes: [],
      draftCover: {
        value: '',
        text: '',
      },
      
      minimapCover: {
        value: '',
        text: '',
      },
      
      sceneItems: [],
    
    }
  },
  methods: {
    
    onSelectActiveScene() {
      
      this.sceneItems = [];
      this.config.scene = this.selectedScene.text;
      
      this.selectedScene.sources.forEach(item => {
        this.sceneItems.push({
          value: item.id,
          text: item.name,
        });
      })
      
      ipc.send('update_config', this.config)
      console.log("Scene selected: ", this.selectedScene);
    },
    
    onSelectDraftCover() {
      let item = this.sceneItems.find(f => f.text === this.draftCover.text);
      this.config.covers.draft = item.text;
      ipc.send('update_config', this.config)
    },
    
    onSelectedMinimap() {
      let item = this.sceneItems.find(f => f.text === this.minimapCover.text);
      this.config.covers.minimap = item.text;
      ipc.send('update_config', this.config)
    },
    
    onAuthorized() {
      
      this.$notify({
        group: 'main',
        title: 'Authentication',
        type: 'success',
        text: 'Authenticated',
      });

      if (this.config.scene !== null) {
        let scene = this.scenes.find(f => f.text === this.config.scene);
        this.selectedScene = scene;
        scene.sources.forEach(item => {
          this.sceneItems.push({
            value: item.id,
            text: item.name,
          });
        });
      }

      if (this.config.covers.minimap !== null) {
        let item = this.sceneItems.find(f => f.text === this.config.covers.minimap);
        this.minimapCover = item;
      }

      if (this.config.covers.draft !== null) {
        let item = this.sceneItems.find(f => f.text === this.config.covers.draft);
        this.draftCover = item;
      }
      
      ipc.send('start-server', { 
        draftCover: this.draftCover,
        minimapCover: this.minimapCover,
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
            'scene-name': this.selectedScene.text,
            'item': this.draftCover.text,
            'visible': visible, 
          }).then(console.log).catch(console.log)
        })

        ipc.on("toggle_minimap_cover", (_, {visible}) => {
          obs.send('SetSceneItemProperties', {
            'scene-name': this.selectedScene.text,
            'item': this.minimapCover.text,
            'visible': visible, 
          }).then(console.log).catch(console.log)
        })

        // Connecting to OBS
        obs.connect({ address: `127.0.0.1:${this.config.port}`, password: this.config.password }).then(() => {
        
          this.btnName = "Connect";
          this.btnDisabled = false;
          this.$refs.tokenInput.disabled = false;
          this.loading = false;
          this.authenticated = true;
          
          return obs.send('GetSceneList');
        
        }).then(data => {
          
          ipc.send('update_config', this.config)
          
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
              this.$notify({
                group: 'main',
                title: 'Authentication',
                type: 'error',
                text: 'Connection error, Make sure you have OBS opened!',
              });
            }
            switch(err.error) {
              case "Authentication Failed.":
                this.btnName = "Connect";
                this.btnDisabled = false;
                this.$refs.tokenInput.disabled = false;
                this.loading = false;
                this.$notify({
                  group: 'main',
                  title: 'Authentication',
                  type: 'error',
                  text: 'Password is incorrect!',
                });
                console.log(err);
                break;
            }
          }
        });

        obs.on('error', err => {
          console.error('Socket err', err);
        });

      }
    },
    logout() {
      this.authenticated = false;
      this.draftCover = {};
      this.minimapCover = {};
      this.loading = false;
    }
  },
  mounted() {

    // requesting config map
    ipc.send("config");

    // recieving configmap
    ipc.on('config_loaded', (_, {config}) => {
      
      this.config = config;
      this.ready = true;
      this.loading = true;

      if (config.password !== null) {
        this.submit();
      } else {
        this.loading = false;
      }

    });

  }
}

</script>
