var request = require("request");
import {DweloApi} from "./lights-api";
var Service, Characteristic;

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-dwelo-thermostat-plugin", "Dwelo Thermostat", DweloLightsAccessory);
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
                // const service = new Service.Lightbulb(this.name, light.id);
                // service.getCharacteristic(Characteristic.On)
                //     .on('get', light.get.bind(light))
                //     .on('set', light.set.bind(light));

                const service = new Service.Thermostat(this.name, light.id);
                 // create handlers for required characteristics
                service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
                    .on('get', light.handleCurrentHeatingCoolingStateGet.bind(light));

                service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .on('get', light.handleTargetHeatingCoolingStateGet.bind(light))
                    .on('set', light.handleTargetHeatingCoolingStateSet.bind(light));

                service.getCharacteristic(Characteristic.CurrentTemperature)
                    .on('get', light.handleCurrentTemperatureGet.bind(light));
            
                service.getCharacteristic(Characteristic.TargetTemperature)
                    .on('get', light.handleTargetTemperatureGet.bind(light))
                    .on('set', light.handleTargetTemperatureSet.bind(light));
            
                service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
                    .on('get', light.handleTemperatureDisplayUnitsGet.bind(light))
                    .on('set', light.handleTemperatureDisplayUnitsSet.bind(light));

                return service;
            });
    }

    getServices() {
        return this.services;
    }
}
