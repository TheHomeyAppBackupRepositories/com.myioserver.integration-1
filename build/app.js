'use strict';

const Homey = require('homey');
var server_data;
const http = require('http.min');

class myIO_App extends Homey.App {

  async onInit() {
    var string2send;
    var updated_settings;
    var _settings = this.homey.settings;
    // get settings variables
    var defaultSettings = _settings.get('defaultSettings');
    var address = _settings.get('address');
    var http_port = _settings.get('http_port');
    var username = _settings.get('username');
    var password = _settings.get('password');
    var offline_counter = 0;
    
    // if it is the first time to start app, fill the settings with default variables
    if (defaultSettings == null) {
      _settings.set('address', '192.168.1.170');
      _settings.set('http_port', '80');
      _settings.set('username', 'admin');
      _settings.set('password', 'admin');
      _settings.set('defaultSettings', 'set');
      _settings.set('status', 'offline');
    }        
    _settings.set('updated_settings', 'true');    // set this from the index.htm to true
    _settings.set('server_data', "");
    const _this = this;
    var _timeout = 4000;

    await ServerUpdate();

    async function ServerUpdate() {
      var __settings = _this.homey.settings;      
      updated_settings = __settings.get('updated_settings');
      if (updated_settings == 'true') {                   //if index.html changed the settings or first turn
        __settings.set('server_data', "");
        address = __settings.get('address');
        http_port = __settings.get('http_port');
        username = __settings.get('username');
        password = __settings.get('password');
        _this.log(address,http_port,username,password);
        string2send = "/d_sens_out.json";
        _this.log("Settings_updated");
        __settings.set('updated_settings', 'false');
        _timeout = 4000;
      } else {
        string2send = "/sens_out.json";
        _timeout = 1500;
      }

      try {
        const respJSON = await http.post({
          uri: "http://" + address + ":" + http_port + string2send,
          timeout: _timeout,
          json:    true,
          headers: {
            'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')
          }
        });        
        const inJSON = respJSON.data;
        if (string2send == "/d_sens_out.json"|| server_data==null || server_data=="") {
          server_data = inJSON;
        } else if (server_data!=null && server_data!=""){
          var key, number, element;
          for (key in inJSON) {
            for (number = 0; number < Object.keys(inJSON[key]).length; number++ ) {
              for (element in inJSON[key][number]) {
                server_data[key][number][element] = inJSON[key][number][element];                      
              }                    
            }       
          }            
        } 
        if (server_data != null && server_data != "") {
          __settings.set('server_data', server_data);
          __settings.set('status', 'online');
          offline_counter = 0;
        }
      } catch(e) {
        if (e == 'Error: socket hang up') { }
        else if (e == 'Error: timeout') { }
        else{_this.log('HTTP request error', e);}
        if (offline_counter == 1) {
          __settings.set('status', 'offline');
          offline_counter = 0;
        } else { offline_counter = 1;}
      }
    }
    
    // refreshing the server_data JSON
    setInterval(async() => {                                 
      await ServerUpdate();      
    }, 5000);

    this.log('myIO_App has been initialized');
  }  
  
}


module.exports = myIO_App;
