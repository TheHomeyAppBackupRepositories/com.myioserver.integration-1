'use strict';
const { Device } = require('homey');
const http = require('http.min');

class myIO_PWM_Device extends Device {

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
    var _actualKey;
    
    this.registerCapabilityListener('onoff', async (value) => {
      update_disabled = true;
      if (value == true) {
        postString = "f_ON=" + id[1];
      } else {
        postString = "f_OFF=" + id[1];
      }
      try {
        await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        if (value == true) {
          server_data['PWM'][id[1] - 101]['state'] = _actualKey['turnON'];
        } else {
          server_data['PWM'][id[1] - 101]['state'] = _actualKey['turnOFF'];
        }
        _settings.set('server_data', server_data);
        update_disabled=false;
      }
    });

    this.registerCapabilityListener('dim', async (value) => {
      update_disabled = true;
      value = parseInt(value * 255);
      postString = "fet*" + id[1] + "=" + value;
      try {
        await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        _actualKey['state'] = value;
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
          _actualKey = server_data['PWM'][id[1] - 101];          
          var state = _actualKey['state'];          
          if (server_data != null && server_data != "") {
            this.setCapabilityValue('dim', state / 255).catch(this.error);
            if (state > _actualKey['turnOFF']) {
              this.setCapabilityValue('onoff', true).catch(this.error);
            } else {
              this.setCapabilityValue('onoff', false).catch(this.error);
            }
          }
        }
      }
    }, 100);

    this.log('myIO_PWM_Device has been initialized');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('myIO_PWM_Device has been added');
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
    this.log('myIO_PWM_Device settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('myIO_PWM_Device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('myIO_PWM_Device has been deleted');
  }

}

module.exports = myIO_PWM_Device;
