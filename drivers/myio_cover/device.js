'use strict';
const { Device } = require('homey');
//const http = require('http.min');

class myIO_Cover_Device extends Device {

  async onInit() {
    
    var id = this.getData().id.split('_');
    id[1] = parseInt(id[1]);
    id[2] = parseInt(id[2]);
    var tempNrChar = "";
    if (id[3] > 1) {
      tempNrChar = id[3].toString();
    }
    var _settings = this.homey.settings;
    var server_data = _settings.get('server_data'+tempNrChar);      
    var key1 = "";
    var key2 = "";
    var id_modifier1 = 1;
    var id_modifier2 = 1;
    var preString1 = "";
    var preString2 = "";
    var update_disabled = true;

    this.registerCapabilityListener('windowcoverings_state', async (value) => {   
      var postString;
      var update_disabled = true;
      
      DeclareVariables();
      if (value == 'up') {
        postString = preString2+"OFF=" + id[2] + "&" + preString1+"ON=" + id[1];
      } else if (value == 'down') {
        postString = preString1+"OFF=" + id[1] + "&" + preString2+"ON=" + id[2];
      } else {
        postString = preString1+"OFF=" + id[1] + "&" + preString2+"OFF=" + id[2];
      }

      var _tempString=_settings.get('sendCommandString'+id[3])+postString+'\n'
      _settings.set('sendCommandString' + id[3], _tempString)      
      
      if (value == 'up') {
        server_data[key1][id[1] - id_modifier1]['state'] = true;
        server_data[key2][id[2] - id_modifier2]['state'] = false;
      } else if (value == 'down') {
        server_data[key1][id[1] - id_modifier1]['state'] = false;
        server_data[key2][id[2] - id_modifier2]['state'] = true;
      } else {
        server_data[key1][id[1] - id_modifier1]['state'] = false;
        server_data[key2][id[2] - id_modifier2]['state'] = false;
      }        
      _settings.set('server_data'+tempNrChar, server_data);
      update_disabled=false;
/*
      try {
        var username = _settings.get('username'+tempNrChar);
        var password = _settings.get('password'+tempNrChar);
        var address = _settings.get('address'+tempNrChar);
        var http_port = _settings.get('http_port' + tempNrChar);
        var parameters = {
          uri: "http://" + address + ":" + http_port + "/empty",
          setTimeout: 1000,
          json: true,
          headers: {
            'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')
          },
        }
        await http.post(parameters, postString);         
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        if (value == 'up') {
          server_data[key1][id[1] - id_modifier1]['state'] = true;
          server_data[key2][id[2] - id_modifier2]['state'] = false;
        } else if (value == 'down') {
          server_data[key1][id[1] - id_modifier1]['state'] = false;
          server_data[key2][id[2] - id_modifier2]['state'] = true;
        } else {
          server_data[key1][id[1] - id_modifier1]['state'] = false;
          server_data[key2][id[2] - id_modifier2]['state'] = false;
        }        
        _settings.set('server_data'+tempNrChar, server_data);
        update_disabled=false;
      }
      */
    });
    
    //sync server_data with app
    myIOEmitter.on('new_server_data_relays_'+id[3], async () => {
      try {
        if (!update_disabled) {
          if (id[1] < 65 && id[1] > 0) {
            key1 = "relays";
            id_modifier1 = 1;
            preString1 = "r_";        
          } else if (id[1] < 3025 && id[1] > 2000) {   
            key1 = "PCA";
            id_modifier1 = 2001;
            preString1 = "PCA_";        
          }
          if (id[2] < 65 && id[2] > 0) {
            key2 = "relays";
            id_modifier2 = 1;
            preString2 = "r_";        
          } else if (id[2] < 3025 && id[2] > 2000) {   
            key2 = "PCA";
            id_modifier2 = 2001;
            preString2 = "PCA_";        
          }
  
          server_data = _settings.get('server_data'+tempNrChar);
          if (server_data == null || server_data == "" || _settings.get('status'+tempNrChar)=='offline') {
            this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
          } else {
            this.setAvailable();
            if (server_data[key1][id[1] - id_modifier1]['state'] != 0) {
              this.setCapabilityValue('windowcoverings_state', "up").catch(this.error);
            } else if (server_data[key2][id[2] - id_modifier2]['state'] != 0) {
              this.setCapabilityValue('windowcoverings_state', "down").catch(this.error);
            }else {
              this.setCapabilityValue('windowcoverings_state', "idle").catch(this.error);
            }
          }
        }
      }catch (error) {
        console.error('Catch:', error);
      }
    });
    
    this.log('myIO_Cover_Device has been initialized');

    function DeclareVariables() {
      if (id[1] < 65 && id[1] > 0) {
        key1 = "relays";
        id_modifier1 = 1;
        preString1 = "r_";        
      } else if (id[1] < 3025 && id[1] > 2000) {   
        key1 = "PCA";
        id_modifier1 = 2001;
        preString1 = "PCA_";        
      }
      if (id[2] < 65 && id[2] > 0) {
        key2 = "relays";
        id_modifier2 = 1;
        preString2 = "r_";        
      } else if (id[2] < 3025 && id[2] > 2000) {   
        key2 = "PCA";
        id_modifier2 = 2001;
        preString2 = "PCA_";        
      }
    }

  }

  async onAdded() {
    this.log('myIO_Cover_Device has been added');
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
    this.log('myIO_Cover_Device settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('myIO_Cover_Device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('myIO_Cover_Device has been deleted');
  }

}

module.exports = myIO_Cover_Device;
