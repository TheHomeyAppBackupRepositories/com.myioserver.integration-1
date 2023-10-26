'use strict';

const { Device } = require('homey');

class myIO_temp_Sensor_Device extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    var id = this.getData().id.split('_');
    id[1] = parseInt(id[1]);
    var server_data = this.homey.settings.get('server_data');

    setInterval(() => {
        server_data = this.homey.settings.get('server_data');
        if (server_data == null || server_data == "")
          this.log("Server_data==null");
        if (server_data != null && server_data != "") {
        
          if ([id[1]] <= 100) {
           // this.log("server_data-relay state: " + server_data['relays'][id[1] - 1]['state']);
            this.setCapabilityValue('measure_temperature', server_data['sensors'][id[1]]['temp'] / 100).catch(this.error);
          }
          
        }
    }, 100);

    this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error)
    
    this.setAvailable();

    this.log('myIO_temp_Sensor_Device has been initialized');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('myIO_temp_Sensor_Device has been added');
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
    this.log('myIO_temp_Sensor_Device settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('myIO_temp_Sensor_Device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('myIO_temp_Sensor_Device has been deleted');
  }

}

module.exports = myIO_temp_Sensor_Device;
