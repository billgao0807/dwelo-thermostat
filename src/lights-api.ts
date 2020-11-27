const https = require('https');

const SUCCESS = null;

const deviceMap = new Map<number, boolean>();

class DweloLight {
    constructor(private readonly api, public readonly id) {
    }

    get = (callback) => {
        this.api.getStatus(this.id)
            .then(isOn => callback(SUCCESS, isOn))
            .catch(callback);
    }

    set = (state, callback) => {
        this.api.toggleLight(state, this.id)
            .then(() => callback(SUCCESS))
            .catch(callback);
    }

    /**
  * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
  */
    handleCurrentHeatingCoolingStateGet(callback) {
        // console.log('Triggered GET CurrentHeatingCoolingState');

        this.api.getStatus(this.id, "state").then(currentState => {
            console.log("CurrentHeatingCoolingState: " + currentState);

            if (typeof currentState === "undefined") {
                callback(null, 0);
                return;
            }

            switch (currentState) {
                case "idle":
                    callback(null, 0);
                    break;
                case "heat":
                    callback(null, 1);
                    break;
                case "cool":
                    callback(null, 2);
                    break;
                default:
                    callback(null, 0);
            }

        })
            .catch(callback);


    }


    /**
     * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
     */
    handleTargetHeatingCoolingStateGet(callback) {
        // console.log('Triggered GET TargetHeatingCoolingState');

        this.api.getStatus(this.id, "mode").then(currentState => {
            console.log("TargetHeatingCoolingState: " + currentState);

            if (typeof currentState === "undefined") {
                callback(null, 0);
                return;
            }

            switch (currentState) {
                case "off":
                    callback(null, 0);
                    break;
                case "heat":
                    callback(null, 1);
                    break;
                case "cool":
                    callback(null, 2);
                    break;
                case "auto":
                    callback(null, 3);
                    break;
                default:
                    callback(null, 0);
            }
        }).catch(callback);

    }

    /**
     * Handle requests to set the "Target Heating Cooling State" characteristic
     */
    handleTargetHeatingCoolingStateSet(value, callback) {
        // console.log('Triggered SET TargetHeatingCoolingState:' + value);

        // this.api.toggleLight(value, this.id)
        //     .then(() => callback(SUCCESS))
        //     .catch(callback);

        callback(null);
    }

    /**
     * Handle requests to get the current value of the "Current Temperature" characteristic
     */
    handleCurrentTemperatureGet(callback) {
        // console.log('Triggered GET CurrentTemperature');

        this.api.getStatus(this.id, "temperature").then(currentState => {

            console.log("CurrentTemperature: " + currentState);

            if (typeof currentState === "undefined") {
                callback(null, 0);
            } else {
                callback(null, parseInt(currentState, 10));
            }
        }).catch(callback);
    }


    /**
     * Handle requests to get the current value of the "Target Temperature" characteristic
     */
    handleTargetTemperatureGet(callback) {
        // console.log('Triggered GET TargetTemperature');

        // set this to a valid value for TargetTemperature
        const currentValue = 1;

        callback(null, currentValue);
    }

    /**
     * Handle requests to set the "Target Temperature" characteristic
     */
    handleTargetTemperatureSet(value, callback) {
        // console.log('Triggered SET TargetTemperature:' + value);

        callback(null);
    }

    /**
     * Handle requests to get the current value of the "Temperature Display Units" characteristic
     */
    handleTemperatureDisplayUnitsGet(callback) {
        // console.log('Triggered GET TemperatureDisplayUnits');

        // set this to a valid value for TemperatureDisplayUnits
        const currentValue = 1;

        callback(null, currentValue);
    }

    /**
     * Handle requests to set the "Temperature Display Units" characteristic
     */
    handleTemperatureDisplayUnitsSet(value, callback) {
        // console.log('Triggered SET TemperatureDisplayUnits:' + value);

        callback(null);
    }
}

export class DweloApi {
    propsMap = new Map<String, String>();
    lastUpdateTime = new Date().getTime();

    constructor(private readonly home, private readonly token) {
    }

    createLight(id) {
        return new DweloLight(this, id);
    }

    makeRequest(path) {
        const _headers = {
            'Authorization': "Token " + this.token
        };
        let _content = undefined;

        const makeRequest = (method) => {
            return new Promise<{ [key: string]: any }>((resolve) => {
                const request = https.request({
                    host: 'api.dwelo.com',
                    path: path,
                    port: 443,
                    method: method,
                    headers: _headers
                }, function (res) {
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        // console.log("->::" + chunk);
                        resolve(JSON.parse(chunk));
                    });
                });

                _content && request.write(_content);
                request.end();
            });
        }

        return {
            POST: (content) => {
                _headers['Content-Type'] = 'application/json;charset=UTF-8';
                _headers['Content-Length'] = Buffer.byteLength(content);
                _content = content;
                return makeRequest('POST');
            },
            GET: () => {
                return makeRequest('GET');
            }
        }
    }

    toggleLight(on: boolean, id: number) {
        const command = `{"command":"${on ? 'on' : 'off'}"}`;
        const path = `/v3/device/${id}/command/`;
        deviceMap.set(id, on);
        return this.makeRequest(path).POST(command);
    }

    getStatus(deviceId: number, sensorType: String) {
        console.log("getStatus: getting status for id: " + deviceId + " sensorType: " + sensorType);

        const currTime = new Date().getTime();
        const diff = (currTime - this.lastUpdateTime) / 1000;

        if (diff > 5 || this.propsMap.size == 0) {
            console.log("map cache stale, refreshing. eplased: " + diff);
            this.lastUpdateTime = new Date().getTime();
            return this.makeRequest(`/v3/sensor/gateway/${this.home}/`).GET().then(r => {


                r.results.filter(s => s.deviceId == deviceId)
                    .map(s =>
                        this.propsMap.set(s.sensorType, s.value));

                // console.log(this.propsMap)

                return this.propsMap.get(sensorType)

            });
        }

        return Promise.resolve(this.propsMap.get(sensorType));

    }
}