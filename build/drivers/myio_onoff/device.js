'use strict';
const { Device } = require('homey');
const http = require('http.min');

class myIO_OnOff_Device extends Device {

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

    //sync server_data with app
    setInterval(() => {
      if (!update_disabled) {
        server_data = _settings.get('server_data');
        if (server_data == null || server_data == "" || _settings.get('status') == 'offline') {
          this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
        } else {
          this.setAvailable();        
          if (server_data['relays'][id[1] - 1]['state'] == 1) {
            this.setCapabilityValue('onoff', true).catch(this.error);
          } else if (server_data['relays'][id[1] - 1]['state'] == 0) {
            this.setCapabilityValue('onoff', false).catch(this.error);
          }
        }
      }
    }, 100);

    this.log('myIO_OnOff_Device has been initialized');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('myIO_OnOff_Device has been added');
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
    this.log('myIO_OnOff_Device settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('myIO_OnOff_Device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('myIO_OnOff_Device has been deleted');
  }

}

module.exports = myIO_OnOff_Device;
