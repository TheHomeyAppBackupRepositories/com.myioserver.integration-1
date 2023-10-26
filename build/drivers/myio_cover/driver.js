'use strict';

const { Driver } = require('homey');
const MyApp = require('../../app');
var server_data;

class myIO_Cover_Driver extends Driver {

  async onInit() {
    //var server_data;
    setInterval(() => {
        server_data = this.homey.settings.get('server_data');      
    }, 2000);
    this.log('myIO_Cover_Driver has been initialized');
  }

  async onPairListDevices() {    
    var returnArray=[];
    var key, number, i = 0;
    
    for (key in server_data) {
      if (key == 'protection') {
        for (number = 0; number < 64; number++) {
          var _actualKey = server_data[key][number];
          if (_actualKey != undefined) {
            if (_actualKey['element0d'] != '') {
              returnArray[i] =
              {
                name: longest_substring_finder(_actualKey['element0d'], _actualKey['element1d']),
                data: { id: 'cover_' + _actualKey['element0'] + "_" + _actualKey['element1'] },
              }
              i++;
            }
          }
        }
      }
    }
    return returnArray;

    function longest_substring_finder(string1, string2) {
      var i = 0;
      var j = 0;
      var answer = "";
      var len1 = string1.length;
      var len2 = string2.length;
      for (i = 0; i < len1;i++){
        var match = "";
        for (j = 0; j < len2;j++){
          if (i + j < len1 && string1[i + j] == string2[j]) {
            match += string2[j];
          }else {
            if (match.length > answer.length) {
              answer = match; 
            }
            match = "";
          }
        }        
      }
      console.log(answer);
    return answer;
    }
  }
}

module.exports = myIO_Cover_Driver;
