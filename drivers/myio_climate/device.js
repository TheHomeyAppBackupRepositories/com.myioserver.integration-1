'use strict';
const { Device } = require('homey');
//const http = require('http.min');

class myIO_Thermostat_Device extends Device {

  async onInit() {
    
    var id = this.getData().id.split('_');
    id[1] = parseInt(id[1]);
    var tempNrChar = "";
    if (id[2] > 1) {
      tempNrChar = id[2].toString();
    }
    var _settings = this.homey.settings;
    var server_data = _settings.get('server_data' + tempNrChar);
    /*
    var username = _settings.get('username' + tempNrChar);
    var password = _settings.get('password'+tempNrChar);
    var address = _settings.get('address'+tempNrChar);
    var http_port = _settings.get('http_port'+tempNrChar);
    var parameters = {
      uri: "http://" + address + ":" + http_port + "/empty",
      setTimeout: 1000,
      json: true,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')
      },
      insecureHTTPParser: true
    };
    */
    var postString;
    var update_disabled = false;
    
    var key = "";
    var id_modifier = 1;
    var minString = "";
    var maxString="";

    this.registerCapabilityListener('onoff', async (value) => {
      update_disabled = true;
      if (id[1] < 65 && id[1] > 0) {
        key = "relays";
        id_modifier = 1;
        postString = "r_";        
      } else if (id[1] < 3025 && id[1] > 2000) {   
        key = "PCA";
        id_modifier = 2001;
        postString = "PCA_";        
      }
      if (value == true) {
        postString += "ON=" + id[1];
      } else {
        postString += "OFF=" + id[1];
      }

      var _tempString=_settings.get('sendCommandString'+id[2])+postString+'\n'
      _settings.set('sendCommandString' + id[2], _tempString)
      server_data[key][id[1] - id_modifier]['state'] = value;        
      _settings.set('server_data'+tempNrChar, server_data);       //**
      update_disabled=false;

/*
      try {
        await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        server_data[key][id[1] - id_modifier]['state'] = value; 
        _settings.set('server_data'+tempNrChar, server_data);
        update_disabled=false;
      }
      */
    });

    this.registerCapabilityListener('target_temperature', async (value) => {
      if (id[1] < 65 && id[1] > 0) {
        key = "relays";
        minString = "min_temp_ON*";
        maxString = "\nmax_temp_OFF*";
        id_modifier = 0;      
      } else if (id[1] < 3025 && id[1] > 2000) {   
        key = "PCA";
        minString = "PCA_temp_MIN*";
        maxString = "\nPCA_temp_MAX*";
        id_modifier = 2000;       
      }
      value *= 10;
      var _sensorON = server_data[key][id[1] - id_modifier]['sensorON'];
      var _sensorOFF = server_data[key][id[1] - id_modifier]['sensorOFF'];
      if (_sensorON < _sensorOFF) {   //heating mode
        postString = minString + [id[1] - id_modifier] + "=" + (value - 5);
        postString += maxString + [id[1] - id_modifier] + "=" + (value + 5);
      } else {                        // cooling mode
        postString = minString + [id[1] - id_modifier] + "=" + (value + 5);
        postString += maxString + [id[1] - id_modifier] + "=" + (value - 5);
      }

      var _tempString=_settings.get('sendCommandString'+id[2])+postString+'\n'
      _settings.set('sendCommandString' + id[2], _tempString)
      if (_sensorON < _sensorOFF) {   //heating mode
        server_data[key][id[1] - id_modifier]['sensorON'] = value - 5;
        server_data[key][id[1] - id_modifier]['sensorOFF'] = value + 5;
      } else {
        server_data[key][id[1] - id_modifier]['sensorON'] = value + 5;
        server_data[key][id[1] - id_modifier]['sensorOFF'] = value - 5;
      }
      _settings.set('server_data' + tempNrChar, server_data);
      update_disabled=false;

      /*
      try {
        const respJSON =  await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        if (_sensorON < _sensorOFF) {   //heating mode
          server_data[key][id[1] - id_modifier]['sensorON'] = value - 5;
          server_data[key][id[1] - id_modifier]['sensorOFF'] = value + 5;
        } else {
          server_data[key][id[1] - id_modifier]['sensorON'] = value + 5;
          server_data[key][id[1] - id_modifier]['sensorOFF'] = value - 5;
        }
        _settings.set('server_data'+tempNrChar, server_data);
        update_disabled=false;
      }
      */
    });

    //sync server_data with app
    myIOEmitter.on('new_server_data_'+id[2], async () => {
      try {
        if (!update_disabled) {
          if (id[1] < 65 && id[1] > 0) {
            key = "relays";
            id_modifier = 1;      
          } else if (id[1] < 3025 && id[1] > 2000) {   
            key = "PCA";
            id_modifier = 2001;       
          }
          server_data = _settings.get('server_data'+tempNrChar);
          if (server_data == null || server_data == "" || _settings.get('status'+tempNrChar) == 'offline') {
            this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
          } else {
            this.setAvailable();
            var _actualKey = server_data[key][id[1] - id_modifier];
            if (_actualKey['sensor'] <= 100 && _actualKey['sensor'] > 0) {
              var sensor = _actualKey['sensor'];            
              var element, elementNumber = -1;
      
              for (element in server_data['sensors']) {
                var _actualID = server_data['sensors'][element]['id'];
                if (_actualID != undefined) {
                  if (_actualID == sensor) elementNumber= element;
                }
              }
  
              this.setCapabilityValue('measure_temperature', server_data['sensors'][elementNumber]['temp'] / 100).catch(this.error);
              var tartgetTemp = (_actualKey['sensorON'] / 10 + _actualKey['sensorOFF'] / 10) / 2;
              this.setCapabilityValue('target_temperature', tartgetTemp).catch(this.error);
              if (_actualKey['state'] != 0) {
                this.setCapabilityValue('onoff', true).catch(this.error);
              } else if (_actualKey['state'] == 0) {
                this.setCapabilityValue('onoff', false).catch(this.error);
              }
            }
          }
        }
      }catch (error) {
        console.error('Catch:', error);
      }
    });
   
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
