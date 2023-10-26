'use strict';

const { Driver } = require('homey');
const MyApp = require('../../app');
var server_data;

class myIO_OnOff_Driver extends Driver {

  async onInit() {
    setInterval(() => {
        server_data = this.homey.settings.get('server_data');
    }, 2000);
    this.log('myIO_OnOff_Driver has been initialized');
  }

  async onPairListDevices() {    
    var returnArray=[];
    var key, number, i = 0;
    
    for (key in server_data) {
      if (key == 'relays') {
        for (number = 0; number < Object.keys(server_data[key]).length; number++) {
          var _actualKey = server_data[key][number];
          if (_actualKey['description'] != '') {
            returnArray[i] =
            {
              name: _actualKey['description'],
              data: { id: 'relay_' + _actualKey['id'] },
            }
            i++;
          }
        }
      }
    }
    return returnArray;
  }
}

module.exports = myIO_OnOff_Driver;
