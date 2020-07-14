var request = require("request");
import {DweloApi} from "./lights-api";
var Service, Characteristic;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-dwelo-lights-plugin", "Dwelo Lights", DweloLightsAccessory);
}

class DweloLightsAccessory {
    log: any;
    config: any;
    name: string;
    api: DweloApi;
    services: any[];

    constructor(log, config) {
        this.log = log;
        this.config = config;
        this.name = config.name;
        this.api = new DweloApi(config.home, config.token);

        this.services = config.lights
            .map(id => this.api.createLight(id))
            .map(light => {
                const service = new Service.Lightbulb(this.name, light.id);
                service.getCharacteristic(Characteristic.On)
                    .on('get', light.get.bind(light))
                    .on('set', light.set.bind(light));
                return service;
            });
    }

    getServices() {
        return this.services;
    }
}
