const https = require('https');

const SUCCESS = null;

const deviceMap = new Map<number, boolean>();

class DweloThermostat {
    constructor(private readonly api, public readonly id) {
    }

    private fToC(fTemp: number) {
        var cTemp = (fTemp - 32) * 5 / 9;
        // console.log("fToC: " + cTemp)
        return cTemp
    }

    private cToF(cTemp:number) {
        var fTemp = Math.round(cTemp * 9 / 5 + 32)
        // console.log("cToF: " + fTemp)
        return fTemp
    }

    /**
     * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
     */
    handleCurrentHeatingCoolingStateGet(callback) {
        this.api.getStatus(this.id, "state").then(currentState => {
            // console.log('Triggered GET CurrentHeatingCoolingState: ' + currentState);

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
                    return;
            }

        })
            .catch(callback);


    }


    /**
     * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
     */
    handleTargetHeatingCoolingStateGet(callback) {
        this.api.getStatus(this.id, "mode").then(targetMode => {
            // console.log('Triggered GET TargetHeatingCoolingState: '+ targetMode);

            if (typeof targetMode === "undefined") {
                callback(null, 0);
                return;
            }

            switch (targetMode) {
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
        var command = ""

        switch (value) {
            case 0:
                command = "off";
                break;
            case 1:
                command = "heat";
                break;
            case 2:
                command = "cool";
                break;
            case 3:
                command = "auto";
                break;
            default:
                callback(null);
                return;
        }

        // console.log('Triggered SET TargetHeatingCoolingState:' + command);

        this.api.toggleCommand(command, this.id)
            .then(() => callback(SUCCESS))
            .catch(callback);
    }

    /**
     * Handle requests to get the current value of the "Current Temperature" characteristic
     */
    handleCurrentTemperatureGet(callback) {
        this.api.getStatus(this.id, "temperature").then(currentTemp => {

            if (typeof currentTemp === "undefined") {
                callback(null, 0);
            } else {
                var fTemp = parseInt(currentTemp, 10)
                var cTemp = this.fToC(fTemp)
                // console.log('Triggered GET CurrentTemperature: ' + cTemp + " c");
                callback(null, cTemp);
            }
        }).catch(callback);
    }

    /**
     * Handle requests to get the current value of the "Target Temperature" characteristic
     */
    handleTargetTemperatureGet(callback) {

        this.api.getStatus(this.id, "state").then(currentState => {
            var targetFTemp: number = this.api.propsMap.get("temperature")
            var cTemp = this.fToC(targetFTemp)

            if (typeof currentState === "undefined") {
                callback(null, cTemp);
                return;
            }

            switch (currentState) {
                // for idel state, check if we're in heating or cooling to get the target temp, for auto, just use current temp
                case "idle":
                    var mode = this.api.propsMap.get("mode")
                    switch (mode) {
                        case "heat":
                            targetFTemp = this.api.propsMap.get("setToHeat")
                            break;
                        case "cool":
                            targetFTemp = this.api.propsMap.get("setToCool")
                            break;
                    }
                    break;
                case "heat":
                case "pendingheat":
                    targetFTemp = this.api.propsMap.get("setToHeat")
                    break;
                case "cool":
                case "pendingcool":
                    targetFTemp = this.api.propsMap.get("setToCool")
                    break;
                default:
                    callback(null, cTemp);
                    return
            }

            // console.log('Triggered GET TargetTemperature: ' + targetFTemp);

            callback(null, this.fToC(targetFTemp));
        }).catch(callback);
    }

    /**
     * Handle requests to set the "Target Temperature" characteristic
     */
    handleTargetTemperatureSet(value, callback) {
        // console.log('Triggered SET TargetTemperature:' + value);

        // convert target temp to F
        var targetFTemp = this.cToF(value)

        // issue correct command based on current mode
        this.api.getStatus(this.id, "mode").then(targetMode => {
            // console.log('Triggered SET TargetTemperature: current mode '+ targetMode);

            // safeguard
            if (typeof targetMode === "undefined") {
                callback(null);
                return;
            }

            var command = ""

            switch (targetMode) {
                case "heat":
                case "cool":
                    command = targetMode
                    this.api.toggleCommand(command, this.id, `,"commandValue":${targetFTemp}`)
                        .then(() => callback(SUCCESS))
                        .catch(callback);
                    break;
                case "auto":
                    this.api.toggleCommand('cool', this.id, `,"commandValue":${targetFTemp + 2}`)
                        .then()
                        
                    this.api.toggleCommand('heat', this.id, `,"commandValue":${targetFTemp}`)
                        .then(() => callback(SUCCESS))
                        .catch(callback);
                    break;
                default:
                    callback(null);
            }


        }).catch(callback);
    }

    /**
     * Handle requests to get the current value of the "Temperature Display Units" characteristic
     */
    handleTemperatureDisplayUnitsGet(callback) {
        // console.log('Triggered GET TemperatureDisplayUnits');

        // hard code it to C
        const currentValue = 0;

        callback(null, currentValue);
    }

    /**
     * Handle requests to set the "Temperature Display Units" characteristic
     */
    handleTemperatureDisplayUnitsSet(value, callback) {
        // console.log('Triggered SET TemperatureDisplayUnits:' + value);

        // no-op
        callback(null);
    }
}

export class DweloApi {
    propsMap = new Map<String, String>();
    lastUpdateTime = new Date().getTime();

    constructor(private readonly home, private readonly token) {
    }

    createThermostat(id) {
        return new DweloThermostat(this, id);
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
                // console.log("POST body: " + content);
                return makeRequest('POST');
            },
            GET: () => {
                return makeRequest('GET');
            }
        }
    }

    toggleCommand(state: string, id: number, value: string = "") {
        const command = `{"command":"${state}"${value}}`;
        const path = `/v3/device/${id}/command/`;
        // deviceMap.set(id, state);
        this.makeRequest(path).POST(command);
        return this.makeRequest(`/v3/sensor/gateway/${this.home}/`).GET()
    }


    getStatus(deviceId: number, sensorType: String) {
        console.log("getStatus: getting status for id: " + deviceId + " sensorType: " + sensorType);

        const currTime = new Date().getTime();
        const diff = (currTime - this.lastUpdateTime) / 1000;

        if (diff > 5 || this.propsMap.size == 0) {
            // console.log("map cache stale, refreshing. eplased: " + diff);
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