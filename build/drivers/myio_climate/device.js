'use strict';
const { Device } = require('homey');
const http = require('http.min');

class myIO_Thermostat_Device extends Device {

  async onInit() {
    
    var id = this.getData().id.split('_');
    id[1] = parseInt(id[1]);
    var _settings = this.homey.settings;
    var server_data = _settings.get('server_data');
    var username = _settings.get('username');
    var password = _settings.get('password');
    var address = _settings.get('address');
    var http_port = _settings.get('http_port');
    var postString;
    var update_disabled = false;
    var parameters = {
      uri: "http://" + address + ":" + http_port + "/empty",
      setTimeout: 1000,
      json: true,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')
      }
    };

    this.registerCapabilityListener('onoff', async (value) => {
      update_disabled = true;
      if (value == true) {
        postString = "r_ON=" + id[1];
      } else {
        postString = "r_OFF=" + id[1];
      }
      try {
        await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        server_data['relays'][id[1] - 1]['state'] = value;
        _settings.set('server_data', server_data);
        update_disabled=false;
      }
    });

    this.registerCapabilityListener('target_temperature', async (value) => {
      value *= 10;
      var _sensorON = server_data['relays'][id[1] - 1]['sensorON'];
      var _sensorOFF = server_data['relays'][id[1] - 1]['sensorOFF'];
      if (_sensorON < _sensorOFF) {   //heating mode
        postString = "min_temp_ON*" + id[1] + "=" + (value - 5);
        postString += "&max_temp_OFF*" + id[1] + "=" + (value + 5);
      } else {                        // cooling mode
        postString = "min_temp_ON*" + id[1] + "=" + (value + 5);
        postString += "&max_temp_OFF*" + id[1] + "=" + (value - 5);
      }
      try {
        const respJSON =  await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        if (_sensorON < _sensorOFF) {   //heating mode
          server_data['relays'][id[1] - 1]['sensorON'] = value - 5;
          server_data['relays'][id[1] - 1]['sensorOFF'] = value + 5;
        } else {
          server_data['relays'][id[1] - 1]['sensorON'] = value + 5;
          server_data['relays'][id[1] - 1]['sensorOFF'] = value - 5;
        }
        _settings.set('server_data', server_data);
        update_disabled=false;
      }
    });

    //sync server_data with app
    setInterval(() => {
      if (!update_disabled) {
        server_data = _settings.get('server_data');
        if (server_data == null || server_data == "" || _settings.get('status') == 'offline') {
          this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
        } else {
          this.setAvailable();
          var _actualKey = server_data['relays'][id[1] - 1];
          if (_actualKey['sensor'] <= 100 && _actualKey['sensor'] > 0) {
            var sensor = _actualKey['sensor'];
            this.setCapabilityValue('measure_temperature', server_data['sensors'][sensor]['temp'] / 100).catch(this.error);
            var tartgetTemp = (_actualKey['sensorON'] / 10 + _actualKey['sensorOFF'] / 10) / 2;
            this.setCapabilityValue('target_temperature', tartgetTemp).catch(this.error);
            if (_actualKey['state'] == 1) {
              this.setCapabilityValue('onoff', true).catch(this.error);
            } else if (_actualKey['state'] == 0) {
              this.setCapabilityValue('onoff', false).catch(this.error);
            }
          }
        }
      }
    }, 100);
    
    this.log('myIO_Thermostat_Device has been initialized');
  }

  async onAdded() {
    this.log('myIO_Thermostat_Device has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('myIO_Thermostat_Device settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('myIO_Thermostat_Device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('myIO_Thermostat_Device has been deleted');
  }

}

module.exports = myIO_Thermostat_Device;
