'use strict';
const { Device } = require('homey');
const http = require('http.min');
var convert = require('color-convert');

class myIO_RGB_Device extends Device {

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
    var onoffString;
    var update_disabled = false;
    var R_ids = [];
    var G_ids = [];
    var B_ids = [];
    var groupSize;
    var R, G, B = 0;
    var H, S, L = 0;
    var parameters = {
      uri: "http://" + address + ":" + http_port + "/empty",
      setTimeout: 1000,
      json: true,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')
      }
    };
    
    this.registerCapabilityListener('onoff', async (value) => {
      postString = "";
      update_disabled = true;
      if (value == true) {
        onoffString = "ON";
      } else {
        onoffString = "OFF";
      }      
      for (var i = 0; i < R_ids.length; i++){
        postString += "f_" + onoffString + "=" + R_ids[i] + "&";        
      }
      for (var i = 0; i < G_ids.length; i++){
        postString += "f_" + onoffString + "=" + G_ids[i] + "&";        
      }
      for (var i = 0; i < B_ids.length; i++){
        postString += "f_" + onoffString + "=" + B_ids[i] + "&";        
      }
      try {
        await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        for (var i = 0; i < Object.keys(server_data['PWM']).length; i++){
          var actual_element = server_data['PWM'][i]['id'];
          for (var j = 0; j < R_ids.length; j++){
            if (actual_element == R_ids[j]) {
              server_data['PWM'][i]['state'] = server_data['PWM'][i]['turn' + onoffString];
            }
          }
          for (var j = 0; j < G_ids.length; j++){
            if (actual_element == G_ids[j]) {
              server_data['PWM'][i]['state'] = server_data['PWM'][i]['turn' + onoffString];
            }
          }
          for (var j = 0; j < B_ids.length; j++){
            if (actual_element == B_ids[j]) {
              server_data['PWM'][i]['state'] = server_data['PWM'][i]['turn' + onoffString];
            }
          }  
        }
        _settings.set('server_data', server_data);
        update_disabled=false;
      }
    });

    this.registerCapabilityListener('dim', async (value) => {
      update_disabled = true;
      [R, G, B] = convert.hsl.rgb(H, S, value * 100);
      postString = "";
      for (var i = 0; i < R_ids.length; i++){
        postString += "fet*" + R_ids[i] + "=" + R+"&";
      }
      for (var i = 0; i < G_ids.length; i++){
        postString += "fet*" + G_ids[i] + "=" + G+"&";
      }
      for (var i = 0; i < B_ids.length; i++){
        postString += "fet*" + B_ids[i] + "=" + B+"&";
      }
      try {
        await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        for (var i = 0; i < Object.keys(server_data['PWM']).length; i++){
          var actual_element = server_data['PWM'][i]['id'];
          for (var j = 0; j < R_ids.length; j++){
            if (actual_element == R_ids[j]) {
              server_data['PWM'][i]['state'] = R;
            }
          }
          for (var j = 0; j < G_ids.length; j++){
            if (actual_element == G_ids[j]) {
              server_data['PWM'][i]['state'] = G;
            }
          }
          for (var j = 0; j < B_ids.length; j++){
            if (actual_element == B_ids[j]) {
              server_data['PWM'][i]['state'] = B;
            }
          }  
        }
        _settings.set('server_data', server_data);
        update_disabled=false;
      }
    });

    this.registerCapabilityListener('light_hue', async (value) => {
      update_disabled = true;
      H = value * 360;     
    });

    this.registerCapabilityListener('light_saturation', async (value) => {
      update_disabled = true;
      [R, G, B] = convert.hsl.rgb(H, value * 100, L);
      postString = "";
      for (var i = 0; i < R_ids.length; i++){
        postString += "fet*" + R_ids[i] + "=" + R+"&";
      }
      for (var i = 0; i < G_ids.length; i++){
        postString += "fet*" + G_ids[i] + "=" + G+"&";
      }
      for (var i = 0; i < B_ids.length; i++){
        postString += "fet*" + B_ids[i] + "=" + B+"&";
      }
      try {
        await http.post(parameters, postString);          
      } catch (e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{this.log('HTTP request error', e);}
      } finally {
        for (var i = 0; i < Object.keys(server_data['PWM']).length; i++){
          var actual_element = server_data['PWM'][i]['id'];
          for (var j = 0; j < R_ids.length; j++){
            if (actual_element == R_ids[j]) {
              server_data['PWM'][i]['state'] = R;
            }
          }
          for (var j = 0; j < G_ids.length; j++){
            if (actual_element == G_ids[j]) {
              server_data['PWM'][i]['state'] = G;
            }
          }
          for (var j = 0; j < B_ids.length; j++){
            if (actual_element == B_ids[j]) {
              server_data['PWM'][i]['state'] = B;
            }
          }  
        }
        _settings.set('server_data', server_data);
        update_disabled=false;
      }
    });

    //sync server_data with app
    setInterval(() => {      
      if (!update_disabled) {
        R_ids = [];
        G_ids = [];
        B_ids = [];
        server_data = _settings.get('server_data');
        if (server_data == null || server_data == "" || _settings.get('status') == 'offline') {
          this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
        } else {
          this.setAvailable();
          //find R,G,B elements in the group, and push it to the R,G,B_ids array 
          for (var i = 0; i < Object.keys(server_data['group']).length; i++){
            if (server_data['group'][i]['id'] == id[1]) {
              var actual_key = server_data['group'][i];
              groupSize = (Object.keys(actual_key).length-3)/2 ;
              for (var j = 0; j < groupSize; j++){
                if (actual_key["element" + j + "d"] != undefined) {
                  var element = actual_key["element" + j];
                  if (element > 200) element -= 100;
                  if (actual_key["element" + j + "d"].startsWith('R')) {
                    R_ids.push(actual_key["element" + j]);
                  } else if (actual_key["element" + j + "d"].startsWith('G')) {
                    G_ids.push(actual_key["element" + j]);
                  } else if (actual_key["element" + j + "d"].startsWith('B')) {
                    B_ids.push(actual_key["element" + j]);
                  }
                }
              }
              break;
            }
          }
          // define R,G,B values from myIO server
          var R, G, B = 0;
          for (var i = 0; i < Object.keys(server_data['PWM']).length; i++){            
              if (server_data['PWM'][i]['id'] == R_ids[0]) {
                R = server_data['PWM'][i]['state'];
              }else if (server_data['PWM'][i]['id'] == G_ids[0]) {
                G = server_data['PWM'][i]['state'];
              }else if (server_data['PWM'][i]['id'] == B_ids[0]) {
                B = server_data['PWM'][i]['state'];
              }            
          }
          [H, S, L] = convert.rgb.hsl(R, G, B);
          this.setCapabilityValue('light_hue', H / 360).catch(this.error);
          this.setCapabilityValue('light_saturation', S / 100).catch(this.error);
          this.setCapabilityValue('dim', L / 100).catch(this.error);
          if (R == 0 && G == 0 && B == 0) {
            this.setCapabilityValue('onoff', false).catch(this.error);
          } else {
            this.setCapabilityValue('onoff', true).catch(this.error);
          }
        }
      }      
    }, 100);

    this.log('myIO_RGB_Device has been initialized');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('myIO_RGB_Device has been added');
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
    this.log('myIO_RGB_Device settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('myIO_RGB_Device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('myIO_RGB_Device has been deleted');
  }

}

module.exports = myIO_RGB_Device;
