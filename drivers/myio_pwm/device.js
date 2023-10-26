'use strict';
const { Device } = require('homey');
const { EventEmitter } = require('stream');
//const http = require('http.min');

class myIO_PWM_Device extends Device {

  async onInit() {
    
    var id = this.getData().id.split('_');
    id[1] = parseInt(id[1]);
    var tempNrChar = "";
    if (id[2] > 1) {
      tempNrChar = id[2].toString();
    }
    var _settings = this.homey.settings;
    var server_data = _settings.get('server_data'+tempNrChar);
    var postString;
    var update_disabled = false;    
    var _actualKey;
    var key = "";
    var id_modifier = 1;

    
     
    if (id[1] < 114 && id[1] > 100) {
      key = "PWM";
      id_modifier = 101;      
    } else if (id[1] < 3025 && id[1] > 2000) {   
      key = "PCA";
      id_modifier = 2001;       
    }
    _actualKey = server_data[key][id[1] - id_modifier];          
         
      
    
    /*
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
      insecureHTTPParser: true
    };
*/
    this.registerCapabilityListener('onoff', async (value) => {
      update_disabled = true;
      if (id[1] < 114 && id[1] > 100) {
        key = "PWM";
        id_modifier = 101;
        postString = "f_";        
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

      _settings.set('server_data'+tempNrChar, server_data);
      update_disabled=false;

/*
      try {
        await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        if (value == true) {
          server_data[key][id[1] - id_modifier]['state'] = _actualKey['turnON'];
        } else {
          server_data[key][id[1] - id_modifier]['state'] = _actualKey['turnOFF'];
        }
        _settings.set('server_data'+tempNrChar, server_data);
        update_disabled=false;
      }
      */
    });

    this.registerCapabilityListener('dim', async (value) => {
      update_disabled = true;
      value = parseInt(value * 255);
      if (id[1] < 114 && id[1] > 100) {
        key = "PWM";
        id_modifier = 101;
        postString = "fet*";        
      } else if (id[1] < 3025 && id[1] > 2000) {   
        key = "PCA";
        id_modifier = 2001;
        postString = "PCA*";        
      }
      postString += id[1] + "=" + value;

      var _tempString=_settings.get('sendCommandString'+id[2])+postString+'\n'
      _settings.set('sendCommandString' + id[2], _tempString)

      _actualKey['state'] = value;
      _settings.set('server_data'+tempNrChar, server_data);
      update_disabled=false;
      /*
      try {
        await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        _actualKey['state'] = value;
        _settings.set('server_data'+tempNrChar, server_data);
        update_disabled=false;
      }
      */
    });
 
    //sync server_data with app
    myIOEmitter.on('new_server_data_relays_'+id[2], async () => {
      try {
        if (!update_disabled) {
          if (id[1] < 114 && id[1] > 100) {
            key = "PWM";
            id_modifier = 101;      
          } else if (id[1] < 3025 && id[1] > 2000) {   
            key = "PCA";
            id_modifier = 2001;       
          }
          this.log("id[1]",id[1])
          server_data = _settings.get('server_data'+tempNrChar);
          if (server_data == null || server_data == "" || _settings.get('status'+tempNrChar) == 'offline') {
            this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
          } else {
            this.setAvailable();
            _actualKey = server_data[key][id[1] - id_modifier];          
            var state = _actualKey['state'];    
            this.log("PWM STATE",state)
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
      }catch (error) {
        console.error('Catch:', error);
      }
    });
    
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
