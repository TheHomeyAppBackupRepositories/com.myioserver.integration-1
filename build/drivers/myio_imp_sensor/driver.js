'use strict';

const { Driver } = require('homey');
var server_data;

class myIO_imp_Sensor_Driver extends Driver {

  async onInit() {
    setInterval(() => {      
      server_data = this.homey.settings.get('server_data');      
    }, 2000);
    this.log('myIO_imp_Sensor_Driver has been initialized');
  }

  async onPairListDevices() {
    var returnArray=[];
    var key, number, i = 0;
    
    for (key in server_data) {
      if (key == 'sensors') {
        var _actualKey = server_data[key][200];
        if (_actualKey != undefined) {
          if ( _actualKey['description'] != '' ) {
            this.log(i + " " + _actualKey['description']);
            returnArray[i] =
            {
              name: _actualKey['description'],
              data: { id: 'sensor_' + _actualKey['id'] },
            }
            i++;
          }
        }
      }
    }    
    return returnArray;
  }
}

module.exports = myIO_imp_Sensor_Driver;
