import { Service, PlatformAccessory, CharacteristicValue, PlatformConfig } from 'homebridge';

import { IopoolHomebridgePlatform } from './platform.js';

import { IopoolApi } from '../services/iopoolApi.js';
import { PoolModel } from '../models/poolModel.js';

export class IopoolPlatformAccessory {
  private tempService: Service;
  private phService: Service;
  private orpService: Service;

  constructor(
    private readonly platform: IopoolHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly config: PlatformConfig,
  ) {

    const pool = this.accessory.context.device as PoolModel;
    const ecoId = pool.latestMeasure ? pool.latestMeasure.ecoId : 'none';
    const active = pool.latestMeasure ? pool.latestMeasure.isValid : false;

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Iopool')
      .setCharacteristic(this.platform.Characteristic.Model, 'Eco')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, ecoId)
      .setCharacteristic(this.platform.Characteristic.Active, active)
      .setCharacteristic(this.platform.Characteristic.InUse, pool.mode === 'STANDARD');

    this.tempService = this.accessory.getService('temperature-sensor') ||
      this.accessory.addService(this.platform.Service.TemperatureSensor, pool.title + ' - Temperature', 'temperature-sensor');
    this.tempService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(this.handleCurrentTemperatureGet.bind(this));
    this.tempService.getCharacteristic(this.platform.Characteristic.ProductData)
      .onGet(this.handleTemperatureDataGet.bind(this));

    this.phService = this.accessory.getService('ph-sensor') ||
      this.accessory.addService(this.platform.Service.AirQualitySensor, pool.title + ' - pH', 'ph-sensor');
    this.phService.getCharacteristic(this.platform.Characteristic.Name)
      .setValue('pH');
    this.phService.getCharacteristic(this.platform.Characteristic.AirQuality)
      .onGet(this.handleCurrentPhGet.bind(this));
    this.phService.getCharacteristic(this.platform.Characteristic.OzoneDensity)
      .onGet(this.handleCurrentPhLevelGet.bind(this));
    this.phService.getCharacteristic(this.platform.Characteristic.ProductData)
      .onGet(this.handlePhDataGet.bind(this));

    this.orpService = this.accessory.getService('orp-sensor') ||
      this.accessory.addService(this.platform.Service.AirQualitySensor, pool.title + ' - ORP', 'orp-sensor');
    this.orpService.getCharacteristic(this.platform.Characteristic.Name)
      .setValue('ORP');
    this.orpService.getCharacteristic(this.platform.Characteristic.AirQuality)
      .onGet(this.handleCurrentOrpGet.bind(this));
    this.orpService.getCharacteristic(this.platform.Characteristic.OzoneDensity)
      .onGet(this.handleCurrentOrpLevelGet.bind(this));
    this.orpService.getCharacteristic(this.platform.Characteristic.ProductData)
      .onGet(this.handleOrpDataGet.bind(this));

    setInterval(async () => {
      const api = new IopoolApi(this.config.token);
      const pool = await api.getPool(this.accessory.context.device.id);
      if (pool !== undefined) {
        this.accessory.context.device = pool;
        this.platform.log.debug('Update values for iopool ->', pool.title);

        this.accessory.getService(this.platform.Service.TemperatureSensor)!.updateCharacteristic(
          this.platform.Characteristic.CurrentTemperature, await this.handleCurrentTemperatureGet());
        this.accessory.getService(this.platform.Service.TemperatureSensor)!.updateCharacteristic(
          this.platform.Characteristic.ProductData, await this.handleTemperatureDataGet());

        this.phService.updateCharacteristic(
          this.platform.Characteristic.AirQuality, await this.handleCurrentPhGet());
        this.phService.updateCharacteristic(
          this.platform.Characteristic.OzoneDensity, await this.handleCurrentPhLevelGet());
        this.phService.updateCharacteristic(
          this.platform.Characteristic.ProductData, await this.handlePhDataGet());

        this.orpService.updateCharacteristic(
          this.platform.Characteristic.AirQuality, await this.handleCurrentOrpGet());
        this.orpService.updateCharacteristic(
          this.platform.Characteristic.OzoneDensity, await this.handleCurrentOrpLevelGet());
        this.orpService.updateCharacteristic(
          this.platform.Characteristic.ProductData, await this.handleOrpDataGet());
      } else {
        this.platform.log.error('Error updating values for iopool ->', this.accessory.context.device.title);
      }
    }, this.config.delay * 60000);
  }

  async handleCurrentTemperatureGet(): Promise<CharacteristicValue> {
    const pool = this.accessory.context.device as PoolModel;

    return pool.latestMeasure ? pool.latestMeasure.temperature : 0;
  }

  async handleTemperatureDataGet(): Promise<CharacteristicValue> {
    const pool = this.accessory.context.device as PoolModel;

    const temperature = pool.latestMeasure ? pool.latestMeasure.temperature : 0;

    return 'temperature: ' + temperature.toString();
  }

  async handleCurrentPhGet(): Promise<CharacteristicValue> {
    const pool = this.accessory.context.device as PoolModel;
    const ph = pool.latestMeasure ? pool.latestMeasure.ph : 0;

    if (ph == 0) {
      return this.platform.Characteristic.AirQuality.UNKNOWN
    } else if (ph <= this.config.pHMinAlert || ph >= this.config.pHMaxAlert) {
      return this.platform.Characteristic.AirQuality.POOR
    } else if (ph < this.config.pHMinWarn || ph > this.config.pHMaxWarn) {
      return this.platform.Characteristic.AirQuality.INFERIOR
    } else {
      return this.platform.Characteristic.AirQuality.GOOD
    };
  }

  async handleCurrentPhLevelGet(): Promise<CharacteristicValue> {
    const pool = this.accessory.context.device as PoolModel;

    const ph = pool.latestMeasure ? pool.latestMeasure.ph : 0;

    return ph * 10
  }

  async handlePhDataGet(): Promise<CharacteristicValue> {
    const pool = this.accessory.context.device as PoolModel;

    const ph = pool.latestMeasure ? pool.latestMeasure.ph : 0;

    return 'ph: ' + ph.toString();
  }

  async handleCurrentOrpGet(): Promise<CharacteristicValue> {
    const pool = this.accessory.context.device as PoolModel;
    const orp = pool.latestMeasure ? pool.latestMeasure.orp : 0;

    if (orp == 0) {
      return this.platform.Characteristic.AirQuality.UNKNOWN
    } else if (orp <= this.config.OrpMinAlert || orp >= this.config.OrpMaxAlert) {
      return this.platform.Characteristic.AirQuality.POOR
    } else if (orp < this.config.OrpMinWarn || orp > this.config.OrpMaxWarn) {
      return this.platform.Characteristic.AirQuality.INFERIOR
    } else {
      return this.platform.Characteristic.AirQuality.GOOD
    };
  }

  async handleCurrentOrpLevelGet(): Promise<CharacteristicValue> {
    const pool = this.accessory.context.device as PoolModel;
    const orp = pool.latestMeasure ? pool.latestMeasure.orp : 0;

    if (orp > 1000) {
      return 1000
    } else {
      return orp
    };
  }

  async handleOrpDataGet(): Promise<CharacteristicValue> {
    const pool = this.accessory.context.device as PoolModel;

    const orp = pool.latestMeasure ? pool.latestMeasure.orp : 0;

    return 'orp: ' + orp.toString();
  }
}
