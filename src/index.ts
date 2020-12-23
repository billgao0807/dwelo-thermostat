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
            .map(id => this.api.createThermostat(id))
            .map(thermostat => {
                // const service = new Service.Lightbulb(this.name, light.id);
                // service.getCharacteristic(Characteristic.On)
                //     .on('get', light.get.bind(light))
                //     .on('set', light.set.bind(light));

                const service = new Service.Thermostat(this.name, thermostat.id);
                 // create handlers for required characteristics
                service.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
                    .on('get', thermostat.handleCurrentHeatingCoolingStateGet.bind(thermostat));

                service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                    .on('get', thermostat.handleTargetHeatingCoolingStateGet.bind(thermostat))
                    .on('set', thermostat.handleTargetHeatingCoolingStateSet.bind(thermostat));

                service.getCharacteristic(Characteristic.CurrentTemperature)
                    .on('get', thermostat.handleCurrentTemperatureGet.bind(thermostat));
            
                service.getCharacteristic(Characteristic.TargetTemperature)
                    .on('get', thermostat.handleTargetTemperatureGet.bind(thermostat))
                    .on('set', thermostat.handleTargetTemperatureSet.bind(thermostat));
            
                service.getCharacteristic(Characteristic.TemperatureDisplayUnits)
                    .on('get', thermostat.handleTemperatureDisplayUnitsGet.bind(thermostat))
                    .on('set', thermostat.handleTemperatureDisplayUnitsSet.bind(thermostat));

                return service;
            });
    }

    getServices() {
        return this.services;
    }
}
