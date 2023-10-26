'use strict';

const { Device } = require('homey');

class myIO_imp_Sensor_Device extends Device {

  async onInit() {

    var id = this.getData().id.split('_');
    id[1] = parseInt(id[1]);
    var tempNrChar = "";
    if (id[2] > 1) {
      tempNrChar = id[2].toString();
    }
    
    var server_data = this.homey.settings.get('server_data'+tempNrChar);
    myIOEmitter.on('new_server_data_sensors_'+id[2], async () => {
      try {
        server_data = this.homey.settings.get('server_data'+tempNrChar);
        if (server_data == null || server_data == "") {
          this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
        }else {
          this.setAvailable();
          this.setCapabilityValue('measure_power', server_data['sensors'][200]['imp']).catch(this.error);
        }
      }catch (error) {
        console.error('Catch:', error);
      }
    });
    /*
    setInterval(() => {
      server_data = this.homey.settings.get('server_data'+tempNrChar);
      if (server_data == null || server_data == "") {
        this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
      }else {
        this.setAvailable();
        this.setCapabilityValue('measure_power', server_data['sensors'][id[1]]['imp']).catch(this.error);
      }
    }, 1000);
*/
    this.log('myIO_imp_Sensor_Device has been initialized');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('myIO_imp_Sensor_Device has been added');
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
    this.log('myIO_imp_Sensor_Device settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('myIO_imp_Sensor_Device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('myIO_imp_Sensor_Device has been deleted');
  }

}

module.exports = myIO_imp_Sensor_Device;
