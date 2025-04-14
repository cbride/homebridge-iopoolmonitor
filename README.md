# homebridge-iopoolmonitor

A small Homebridge plugin to monitor your swimming pool(s) using [iopool](https://iopool.com) product & service. This plugin monitor Temperature, pH, and ORP.

![Preview](./assets/preview.jpg)

# Installation
This plugin needs Homebridge server installed, follow [Homebridge website](https://homebridge.io/) to install it.

Once Homebridge server installed, you can add this plugin from the server UI or using NPM command:
```bash
npm install -g homebridge-iopoolmonitor
```

# Configuration
You need to configure the plugin before using it. Please see the config settings in the UI or update your config.json file in your server directory.

```json
"platforms": [
        ...,
        {
            "platform": "HomebridgeIopoolMonitor",
            "name": "iopool",
            "token": "[YOUR IOPOOL TOKEN]",
            "delay": 15,
            "pHMinWarn": 7.1,
            "pHMinAlert": 6.8,
            "pHMaxWarn": 7.7,
            "pHMaxAlert": 8.1,
            "OrpMinWarn": 650,
            "OrpMinAlert": 550,
            "OrpMaxWarn": 800,
            "OrpMaxAlert": 1000
        }
    ],
```
__Note:__ The token can be retrieved in the iopool mobile application.
