'use strict';

const { Driver } = require('homey');
//var server_data = new Array();
//var serverActive = new Array();

class myIO_OnOff_Driver extends Driver {

  async onInit() {
    /*
    for (var i = 1; i <= 10; i++) {
      var tempNrChar = "";
      if (i > 1) {
        tempNrChar = i.toString();
      }
      serverActive[i]=this.homey.settings.get('serverActive'+tempNrChar);
      if (serverActive[i] == "true") {
        const _i = i;
        const _tempNrChar = tempNrChar;     
        server_data[_i] = this.homey.settings.get('server_data' + _tempNrChar);
        myIOEmitter.on('new_server_data_relays_' + i, async () => {
          try {
            server_data[_i] = this.homey.settings.get('server_data' + _tempNrChar);
          }catch (error) {
            console.error('Catch:', error);
          }
        }); 
      }
    }
    */
    this.log('myIO_OnOff_Driver has been initialized');
  }

  async onPairListDevices() {    
    var returnArray=[];
    var _serverID, key, number, i = 0;
    
    for (_serverID = 1; _serverID <= 10; _serverID++) {
      var tempNrChar = "";
      if (_serverID > 1) {
        tempNrChar = _serverID.toString();
      }      
      var server_data= this.homey.settings.get('server_data' + tempNrChar);
      if (this.homey.settings.get('serverActive'+tempNrChar) == "true") {
        for (key in server_data) {
          if (key == 'relays' || key == 'PCA') {
            for (number = 0; number < Object.keys(server_data[key]).length; number++) {
              var _actualKey = server_data[key][number];
              if (_actualKey['description'] != '' && (_actualKey['pwm'] == 0 || key != 'PCA')) {
                returnArray[i] =
                {
                  name: _actualKey['description'],
                  data: { id: 'relay_' + _actualKey['id'] +'_'+_serverID},
                }
                i++;
              }
            }
          }
        }
      }
    }
    return returnArray;
  }
}

module.exports = myIO_OnOff_Driver;
