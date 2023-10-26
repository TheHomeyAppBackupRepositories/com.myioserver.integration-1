'use strict';
const { Device } = require('homey');
//const http = require('http.min');
var convert = require('color-convert');

class myIO_RGB_Device extends Device {

  async onInit() {
    
    var id = this.getData().id.split('_');
    id[1] = parseInt(id[1]);
    var tempNrChar = "";
    if (id[2] > 1) {
      tempNrChar = id[2].toString();
    }
    var _settings = this.homey.settings;
    var server_data = _settings.get('server_data'+tempNrChar);
    var preString = "";
    var postString;
    var onoffString;
    var update_disabled = false;
    var R_ids = [];
    var G_ids = [];
    var B_ids = [];
    var groupSize;
    var R, G, B = 0;
    var H, S, L = 0;

    

    if (!update_disabled) {
      R_ids = [];
      G_ids = [];
      B_ids = [];
      if (server_data == null || server_data == "" || _settings.get('status'+tempNrChar) == 'offline') {
        this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
      } else {
        this.setAvailable();
        //find R,G,B elements in the group, and push it to the R,G,B_ids array 
        for (var i = 0; i < Object.keys(server_data['group']).length; i++){
          if (server_data['group'][i]['id'] == id[1]) {
            var actual_key = server_data['group'][i];
            groupSize = (Object.keys(actual_key).length-3)/2 ;
            for (var j = 0; j < groupSize; j++){
              if (actual_key["element" + j] > 0) { 
                var element = actual_key["element" + j];

                if (element > 2000 && element < 3015) {
                  actual_key['element'+j+'d'] = server_data['PCA'][element - 2001]['description'];
                }

                if (element > 200 && element < 214) element -= 100;
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
        for (var i = 0; i < Object.keys(server_data['PCA']).length; i++){            
          if (server_data['PCA'][i]['id'] == R_ids[0]) {
            R = server_data['PCA'][i]['state'];
          }else if (server_data['PCA'][i]['id'] == G_ids[0]) {
            G = server_data['PCA'][i]['state'];
          }else if (server_data['PCA'][i]['id'] == B_ids[0]) {
            B = server_data['PCA'][i]['state'];
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
    /*
    var username = _settings.get('username'+tempNrChar);
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
      insecureHTTPParser: true  //I had to add this line, to make work the app with the new Homey Pro
    };
    */
    
    
    this.registerCapabilityListener('onoff', async (value) => {
      postString = "";
      update_disabled = true;
      if (value == true) {
        onoffString = "ON";
      } else {
        onoffString = "OFF";
      }     

      for (var i = 0; i < R_ids.length; i++){
        if (R_ids[i] < 114 && R_ids[i] > 100) {          
          preString = "f_";        
        } else if (R_ids[i] < 3025 && R_ids[i] > 2000) { 
          preString = "PCA_";        
        }
        postString += preString + onoffString + "=" + R_ids[i] + "&";  
        
      }
      for (var i = 0; i < G_ids.length; i++){
        if (G_ids[i] < 114 && G_ids[i] > 100) {          
          preString = "f_";        
        } else if ( G_ids[i] < 3025 &&  G_ids[i] > 2000) { 
          preString = "PCA_";        
        }
        postString += preString + onoffString + "=" + G_ids[i] + "&";        
      }
      for (var i = 0; i < B_ids.length; i++){
        if (B_ids[i] < 114 && B_ids[i] > 100) {          
          preString = "f_";        
        } else if (B_ids[i] < 3025 && B_ids[i] > 2000) { 
          preString = "PCA_";        
        }
        postString += preString + onoffString + "=" + B_ids[i] + "&";        
      }

      var _tempString = _settings.get('sendCommandString' + id[2]) + postString + '\n'
      this.log(postString,_tempString)
      _settings.set('sendCommandString' + id[2], _tempString)

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
      
      for (var i = 0; i < Object.keys(server_data['PCA']).length; i++){
        var actual_element = server_data['PCA'][i]['id'];
        for (var j = 0; j < R_ids.length; j++){
          if (actual_element == R_ids[j]) {
            server_data['PCA'][i]['state'] = server_data['PCA'][i]['turn' + onoffString];
          }
        }
        for (var j = 0; j < G_ids.length; j++){
          if (actual_element == G_ids[j]) {
            server_data['PCA'][i]['state'] = server_data['PCA'][i]['turn' + onoffString];
          }
        }
        for (var j = 0; j < B_ids.length; j++){
          if (actual_element == B_ids[j]) {
            server_data['PCA'][i]['state'] = server_data['PCA'][i]['turn' + onoffString];
          }
        }  
      }
      
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
        
        for (var i = 0; i < Object.keys(server_data['PCA']).length; i++){
          var actual_element = server_data['PCA'][i]['id'];
          for (var j = 0; j < R_ids.length; j++){
            if (actual_element == R_ids[j]) {
              server_data['PCA'][i]['state'] = server_data['PCA'][i]['turn' + onoffString];
            }
          }
          for (var j = 0; j < G_ids.length; j++){
            if (actual_element == G_ids[j]) {
              server_data['PCA'][i]['state'] = server_data['PCA'][i]['turn' + onoffString];
            }
          }
          for (var j = 0; j < B_ids.length; j++){
            if (actual_element == B_ids[j]) {
              server_data['PCA'][i]['state'] = server_data['PCA'][i]['turn' + onoffString];
            }
          }  
        }
        
        _settings.set('server_data'+tempNrChar, server_data);
        update_disabled=false;
      }
      */
    });

    this.registerCapabilityListener('dim', async (value) => {
      update_disabled = true;
      [R, G, B] = convert.hsl.rgb(H, S, value * 100);
      postString = "";

      for (var i = 0; i < R_ids.length; i++){
        if (R_ids[i] < 114 && R_ids[i] > 100) {          
          preString = "fet*";        
        } else if (R_ids[i] < 3025 && R_ids[i] > 2000) { 
          preString = "PCA*";        
        }
        postString += preString + R_ids[i] + "=" + R + "&";          
      }
      for (var i = 0; i < G_ids.length; i++){
        if (G_ids[i] < 114 && G_ids[i] > 100) {          
          preString = "fet*";        
        } else if ( G_ids[i] < 3025 &&  G_ids[i] > 2000) { 
          preString = "PCA*";        
        }
        postString += preString + G_ids[i] + "=" + G + "&";         
      }
      for (var i = 0; i < B_ids.length; i++){
        if (B_ids[i] < 114 && B_ids[i] > 100) {          
          preString = "fet*";        
        } else if (B_ids[i] < 3025 && B_ids[i] > 2000) { 
          preString = "PCA*";        
        }
        postString += preString + B_ids[i] + "=" + B + "&";         
      }
      
      var _tempString=_settings.get('sendCommandString'+id[2])+postString+'\n'
      _settings.set('sendCommandString' + id[2], _tempString)

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
      for (var i = 0; i < Object.keys(server_data['PCA']).length; i++){
        var actual_element = server_data['PCA'][i]['id'];
        for (var j = 0; j < R_ids.length; j++){
          if (actual_element == R_ids[j]) {
            server_data['PCA'][i]['state'] = R;
          }
        }
        for (var j = 0; j < G_ids.length; j++){
          if (actual_element == G_ids[j]) {
            server_data['PCA'][i]['state'] = G;
          }
        }
        for (var j = 0; j < B_ids.length; j++){
          if (actual_element == B_ids[j]) {
            server_data['PCA'][i]['state'] = B;
          }
        }  
      }
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
        for (var i = 0; i < Object.keys(server_data['PCA']).length; i++){
          var actual_element = server_data['PCA'][i]['id'];
          for (var j = 0; j < R_ids.length; j++){
            if (actual_element == R_ids[j]) {
              server_data['PCA'][i]['state'] = R;
            }
          }
          for (var j = 0; j < G_ids.length; j++){
            if (actual_element == G_ids[j]) {
              server_data['PCA'][i]['state'] = G;
            }
          }
          for (var j = 0; j < B_ids.length; j++){
            if (actual_element == B_ids[j]) {
              server_data['PCA'][i]['state'] = B;
            }
          }  
        }
        _settings.set('server_data'+tempNrChar, server_data);
        update_disabled=false;
      }
      */
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
        if (R_ids[i] < 114 && R_ids[i] > 100) {          
          preString = "fet*";        
        } else if (R_ids[i] < 3025 && R_ids[i] > 2000) { 
          preString = "PCA*";        
        }
        postString += preString + R_ids[i] + "=" + R + "&";          
      }
      for (var i = 0; i < G_ids.length; i++){
        if (G_ids[i] < 114 && G_ids[i] > 100) {          
          preString = "fet*";        
        } else if ( G_ids[i] < 3025 &&  G_ids[i] > 2000) { 
          preString = "PCA*";        
        }
        postString += preString + G_ids[i] + "=" + G + "&";         
      }
      for (var i = 0; i < B_ids.length; i++){
        if (B_ids[i] < 114 && B_ids[i] > 100) {          
          preString = "fet*";        
        } else if (B_ids[i] < 3025 && B_ids[i] > 2000) { 
          preString = "PCA*";        
        }
        postString += preString + B_ids[i] + "=" + B + "&";         
      }


      var _tempString=_settings.get('sendCommandString'+id[2])+postString+'\n'
      _settings.set('sendCommandString' + id[2], _tempString)

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
      for (var i = 0; i < Object.keys(server_data['PCA']).length; i++){
        var actual_element = server_data['PCA'][i]['id'];
        for (var j = 0; j < R_ids.length; j++){
          if (actual_element == R_ids[j]) {
            server_data['PCA'][i]['state'] = R;
          }
        }
        for (var j = 0; j < G_ids.length; j++){
          if (actual_element == G_ids[j]) {
            server_data['PCA'][i]['state'] = G;
          }
        }
        for (var j = 0; j < B_ids.length; j++){
          if (actual_element == B_ids[j]) {
            server_data['PCA'][i]['state'] = B;
          }
        }  
      }
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
        for (var i = 0; i < Object.keys(server_data['PCA']).length; i++){
          var actual_element = server_data['PCA'][i]['id'];
          for (var j = 0; j < R_ids.length; j++){
            if (actual_element == R_ids[j]) {
              server_data['PCA'][i]['state'] = R;
            }
          }
          for (var j = 0; j < G_ids.length; j++){
            if (actual_element == G_ids[j]) {
              server_data['PCA'][i]['state'] = G;
            }
          }
          for (var j = 0; j < B_ids.length; j++){
            if (actual_element == B_ids[j]) {
              server_data['PCA'][i]['state'] = B;
            }
          }  
        }
        _settings.set('server_data'+tempNrChar, server_data);
        update_disabled=false;
      }
      */
    });

    //sync server_data with app
    myIOEmitter.on('new_server_data_relays_'+id[2], async () => {
      try {
        if (!update_disabled) {
          R_ids = [];
          G_ids = [];
          B_ids = [];
          server_data = _settings.get('server_data'+tempNrChar);
          if (server_data == null || server_data == "" || _settings.get('status'+tempNrChar) == 'offline') {
            this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
          } else {
            this.setAvailable();
            //find R,G,B elements in the group, and push it to the R,G,B_ids array 
            for (var i = 0; i < Object.keys(server_data['group']).length; i++){
              if (server_data['group'][i]['id'] == id[1]) {
                var actual_key = server_data['group'][i];
                groupSize = (Object.keys(actual_key).length-3)/2 ;
                for (var j = 0; j < groupSize; j++){
                  if (actual_key["element" + j] > 0) { 
                    var element = actual_key["element" + j];

                    if (element > 2000 && element < 3015) {
                      actual_key['element'+j+'d'] = server_data['PCA'][element - 2001]['description'];
                    }

                    if (element > 200 && element < 214) element -= 100;
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
            for (var i = 0; i < Object.keys(server_data['PCA']).length; i++){            
              if (server_data['PCA'][i]['id'] == R_ids[0]) {
                R = server_data['PCA'][i]['state'];
              }else if (server_data['PCA'][i]['id'] == G_ids[0]) {
                G = server_data['PCA'][i]['state'];
              }else if (server_data['PCA'][i]['id'] == B_ids[0]) {
                B = server_data['PCA'][i]['state'];
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
      }catch (error) {
        console.error('Catch:', error);
      }
    });

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
