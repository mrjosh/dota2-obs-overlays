const WebsocketClient = require('sockjs-client');

//Event message ID's to manage our callbacks from slobs.
const ConnectEvent = 1,
	StreamingStatusEvent = 2,
	StreamingStatusChangedEvent = 3,
	ScenesEvent = 4;

export default class StreamlabsOBSClient {

	token;
	scenes;
	sceneIds;
	startTimer;
	onMessageCallback = () => {};
	onLogCallback = () => {};

	constructor(opts) {
		this.onLogCallback("Constructing ...")
		this.port = opts.port === undefined ? 59650 : opts.port
		this.uri = opts.uri === undefined ? "127.0.0.1" : opts.uri
		this.path = opts.path === undefined ? "api" : opts.path
		this.token = opts.token;
		this.scenes = [];
		this.sceneIds = {};
		this.connectionString = `http://${this.uri}:${this.port}/${this.path}`
	}

	connect() {
		return new Promise((resolve, reject) => {

			this.socket = new WebsocketClient(this.connectionString);

			//AUTHORIZE WITH SLOBS
			this.socket.onopen = () => {
				this.authenticate()
			};

			// HANDLE MESSAGES RECEIVED
			this.socket.onmessage = message => {

				this.onMessageCallback(message);

				const data = JSON.parse(message.data);

				switch (data.id) {
					case ConnectEvent:
						if ("error" in data) {
							reject(data.error)
							return
						}
						if ("result" in data) {
							if (data.result) {
								this.subscribe("streaming");
								this.subscribe("status");
								this.subscribe("scenes");
								resolve()
							}
						}
						break
					case StreamingStatusEvent:
						this.streamStatus = data.result.streamingStatus
						this.startTimer = (this.streamStatus === 'live' ? data.result.streamingStatusTime : null);
						break
					case ScenesEvent:
						for (let i = 0; i < data.result.length; i++) {
							let scene = {
								value: data.result[i].id,
								text: data.result[i].name,
								items: [],
							};
							for (let j = 0; j < data.result[i].nodes.length; j++) {
								scene.items.push(data.result[i].nodes[j]);
							}
							this.scenes.push(scene)
						}
						break;
					default:
						break;
				}

			}

			//Output error message if socket closes
			this.socket.onclose = err => {
				console.log(err);
			};

		});
	}

	onMessage(callback) {
		this.onMessageCallback = callback
	}

	onLog(callback) {
		this.onLogCallback = callback
	}

	subscribe(event) {
		let message;
		switch (event) {
			case "streaming":
				message = {
					id: StreamingStatusChangedEvent,
					jsonrpc: '2.0',
					method: 'streamingStatusChange',
					params: { resource: 'StreamingService' },
				}
				break
			case "status":
				message = {
					id: StreamingStatusEvent,
					jsonrpc: '2.0',
					method: 'getModel',
					params: { resource: 'StreamingService' },
				}
				break
			case "scenes":
				message = {
					id: ScenesEvent,
					jsonrpc: '2.0',
					method: 'getScenes',
					params: { resource: 'ScenesService' },
				}
				break
		}
		this.send(message);
	}

	getSourceItemFromScene(sceneName, sourceName) {
		return this.scenes[sceneName].get(sourceName)
	}

	changeSourceVisibility(sceneName, sourceName, visibility) {
		const source = this.getSourceItemFromScene(sceneName, sourceName)
		if (visibility == null) {
			visibility = !source.visible
		}
		this.send({
			id: 10,
			jsonrpc: '2.0',
			method: 'setVisibility',
			params: {
				resource: `SceneItem["${source.sceneId}","${source.sceneItemId}","${source.sourceId}"]`,
				args: [visibility]
			},
		});
		source.visible = visibility
	}

	toggleSourceVisibility(sceneName, sourceName) {
		this.changeSourceVisibility(sceneName, sourceName, null)
	}

	changeScene(sceneName) {
		this.send({
			id: 10,
			jsonrpc: '2.0',
			method: 'makeSceneActive',
			params: {
				resource: 'ScenesService',
				args: [this.sceneIds[sceneName]],
			},
		});
	}

	send(message) {
		this.socket.send(JSON.stringify(message));
	}

	authenticate() {
		this.onLogCallback("Authenticating to Streamlabs-OBS websocket...");
		this.socket.send(JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'auth',
			params: {
				resource: 'TcpServerService',
				args: [this.token],
			},
		}));
	}

}