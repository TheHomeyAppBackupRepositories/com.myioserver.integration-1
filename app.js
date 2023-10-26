'use strict';

const Homey = require('homey');

const http = require('http.min');

const EventEmitter = require('events');

global.myIOEmitter = new EventEmitter();
class myIO_App extends Homey.App {
  

  async onInit() {
    global.myIOEmitter.setMaxListeners(2000);
    
    var server_data = new Array();
    var string2send;
    var updated_settings= new Array();
    var _settings = this.homey.settings;

    // get settings variables

    var address = new Array();
    var http_port = new Array();
    var username = new Array();
    var password = new Array();
    var defaultSettings = new Array();
    var status = new Array();
    var offline_counter = new Array();
    var serverActive = new Array();    
    var sendInProgress = new Array(); 
    var firstRunEnded = new Array();

    address[1] = _settings.get('address');
    http_port[1] = _settings.get('http_port');
    username[1] = _settings.get('username');
    password[1] = _settings.get('password');
    defaultSettings[1] = _settings.get('defaultSettings');
    status[1] = _settings.get('status');
    offline_counter[1] = 0;
    serverActive[1] = 'true';

  
    
    // if it is the first time to start app, fill the settings with default variables
    if (defaultSettings == null) {
      _settings.set('address', '192.168.1.170');
      _settings.set('http_port', '80');
      _settings.set('username', 'admin');
      _settings.set('password', 'admin');
      _settings.set('defaultSettings', 'set');
      _settings.set('status', 'offline');
      _settings.set('serverActive', 'true');
    }  
    _settings.set('updated_settings', 'true');    // set this from the index.htm to true
    _settings.set('server_data', "");
    _settings.set('sendCommandString1', "");
    sendInProgress[1] = 0;
    //Multi server
    for (var i = 2; i <= 10; i++) {
      sendInProgress[i] = 0;
      serverActive[i] = _settings.get('serverActive' + i);
      _settings.set('sendCommandString' + i, "");
      if (serverActive[i]== 'true') {
        address[i] = _settings.get('address'+i);
        http_port[i] = _settings.get('http_port'+i);
        username[i] = _settings.get('username'+i);
        password[i] = _settings.get('password' + i);
        status[i] = _settings.get('status'+i);
        offline_counter[i] = 0;
        _settings.set('server_data' + i, "");
        _settings.set('updated_settings' + i, 'true');
        
      }
    }

    const _this = this;
    var _timeout = 5000;
    try {
      await ServerUpdate();
    }catch (error) {
      console.error('Hiba történt az alkalmazás inicializálása közben:', error);
    }
    

    async function ServerUpdate() {
      var __settings = _this.homey.settings;   
      var i;
      for (i = 1; i <= 10; i++) {  
        var _serverDataChanged = false;
        var _serverDataChangedRelays = false;
        var _serverDataChangedSensors = false;
        var tempNrChar = "";
        if (i > 1) {
          tempNrChar = i.toString();
        }
        updated_settings[i] = __settings.get('updated_settings'+ tempNrChar);

        if (updated_settings[i] == 'true') {                   //if index.html changed the settings or first turn
          __settings.set('server_data' + tempNrChar, "");
          address[i] = __settings.get('address' + tempNrChar);
          http_port[i] = __settings.get('http_port' + tempNrChar);
          username[i] = __settings.get('username' + tempNrChar);
          password[i] = __settings.get('password' + tempNrChar);
          serverActive[i] = __settings.get('serverActive' + tempNrChar);
          _this.log("Settings_updated on Server: " + tempNrChar, address[i], http_port[i], username[i]);
          string2send = "/d_sens_out.json";          
          __settings.set('updated_settings' + tempNrChar, 'false');
          _timeout = 7000;
        } else {
          string2send = "/sens_out.json";
          _timeout = 2000;
        }
        if (serverActive[i] == 'true') { 
          const _id = i;
          try {
            const respJSON = await http.post({
              uri: "http://" + address[_id] + ":" + http_port[_id] + string2send,
              timeout: _timeout,
              json: true,
              headers: {
                'Authorization': 'Basic ' + Buffer.from(username[_id] + ":" + password[_id]).toString('base64')
              },
              insecureHTTPParser: true
            });
            const inJSON = respJSON.data;
            if (string2send == "/d_sens_out.json" || server_data[_id] == null || server_data[_id] == "") {
              server_data[_id] = inJSON;
            } else if (server_data[_id] != null && server_data[_id] != "") {
              var key, number, element;
              for (key in inJSON) {
                for (number = 0; number < Object.keys(inJSON[key]).length; number++) {
                  for (element in inJSON[key][number]) {
                    if (server_data[_id][key][number][element]!= inJSON[key][number][element]) {
                      server_data[_id][key][number][element] = inJSON[key][number][element];
                      _serverDataChanged = true;
                      if (key == 'sensors') {
                        _serverDataChangedSensors = true;
                      } else {
                        _serverDataChangedRelays = true;
                      }
                      _serverDataChanged = true;
                    }                    
                  }
                }
              }
            }
            if (server_data[_id] != null && server_data[_id] != "") {
              __settings.set('server_data' + tempNrChar, server_data[_id]);    
              if (offline_counter[_id] != 0) {
                __settings.set('status' + tempNrChar, 'online');
                offline_counter[_id] = 0;
                _serverDataChanged = true;
                _serverDataChangedSensors = true;
                _serverDataChangedRelays = true;
              }              
            }
          } catch (e) {
            _this.log(e,'on Server :'+_id)
            if (e == 'Error: socket hang up') { }
            else if (e == 'Error: timeout') { }
            else { _this.log('HTTP request error on Server :'+_id); }
            if (offline_counter[_id] == 1) {
              __settings.set('status' + tempNrChar, 'offline');
              _serverDataChanged = true;
              _serverDataChangedSensors = true;
              _serverDataChangedRelays = true;
              offline_counter[_id] = 2;
            } else { offline_counter[_id] = 1; }
          } finally {
            _this.log("Refreshing Server data:" + _id);
            if (_serverDataChanged) myIOEmitter.emit('new_server_data_'+_id);
            if (_serverDataChangedSensors) {
              myIOEmitter.emit('new_server_data_sensors_' + _id)
              _this.log("New Sensor data on Server:"+_id)
            } 
            if (_serverDataChangedRelays) {
            myIOEmitter.emit('new_server_data_relays_' + _id);
              _this.log("New Relay data on Server:"+_id)
            }
            if (firstRunEnded[_id] != 1) {
              _this.log("first Run emitting:",_id)
              myIOEmitter.emit('new_server_data_relays_' + _id);
              myIOEmitter.emit('new_server_data_sensors_' + _id);
              myIOEmitter.emit('new_server_data_' + _id);
              firstRunEnded[_id] = 1;
            }            
          }  
        }   
      }       
    }
    
    async function SendCommand() {
      for (i = 1; i <= 10; i++) {
        var tempNrChar = "";
        if (i > 1) {
          tempNrChar = i.toString();
        }
        var sendCommandString = _settings.get('sendCommandString' + i);
        
        if (sendCommandString != "" && sendInProgress[i]==0) {          
          _this.log(sendCommandString);
          sendInProgress[i] = 1;           
          try {            
            var parameters = {          
              uri: "http://" + address[i] + ":" + http_port[i] + "/empty",
              setTimeout: 1000,
              json: true,
              headers: {
                'Authorization': 'Basic ' + Buffer.from(username[i] + ":" + password[i]).toString('base64')
              },
              insecureHTTPParser: true
            };
            await http.post(parameters, sendCommandString);  
          } catch (e) {
            //_this.log(e," on Server : "+i)
            if (e == 'Error: socket hang up') { }
            else if (e == 'Error: timeout') { }
            else{}
          } finally{
            _settings.set('sendCommandString' + i, "")
            sendInProgress[i] = 0;
          }          
        }
      }
    }


    setInterval(async () => {   
      await SendCommand();       
    }, 300);
    // refreshing the server_data JSON
    setInterval(async () => {   
      await ServerUpdate();       
    }, 10000);

    this.log('myIO_App has been initialized');
  }  
  
}

module.exports =  myIO_App ;
