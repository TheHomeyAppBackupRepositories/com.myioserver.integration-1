'use strict';

const { Driver } = require('homey');
var server_data;

class myIO_RGB_Driver extends Driver {

  async onInit() {
    setInterval(() => {      
        server_data = this.homey.settings.get('server_data');      
    }, 2000);
    this.log('myIO_RGB_Driver has been initialized');
  }

  async onPairListDevices() {    
    var returnArray=[];
    var key, number, i = 0;
    
    for (key in server_data) {
      if (key == 'group') {
        for (number = 0; number < 100; number++) {
          var _actualKey = server_data[key][number];
          if (_actualKey != undefined) {
            if (_actualKey['description'] != '') {
              if (_actualKey['description'].startsWith("RGB")) {
                returnArray[i] =
                {
                  name: _actualKey['description'],
                  data: { id: 'RGB_' + _actualKey['id'] },
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

module.exports = myIO_RGB_Driver;
