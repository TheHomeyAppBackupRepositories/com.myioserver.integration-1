'use strict';
const { Driver } = require('homey');
//var server_data = new Array();
//var serverActive = new Array();

class myIO_Cover_Driver extends Driver {

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
        
        myIOEmitter.on('new_server_data_relays_'+i, async () => {
          try {
            server_data[_i] = this.homey.settings.get('server_data' + _tempNrChar);
          }catch (error) {
            console.error('Catch:', error);
          }
        });
      }
    }
    */
    this.log('myIO_Cover_Driver has been initialized');
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
          if (key == 'protection') {
            for (number = 0; number < 64; number++) {
              var _actualKey = server_data[key][number];
              if (_actualKey != undefined) {
                if (_actualKey['element0'] > 0) {
                  if (_actualKey['element0'] > 2000) {
                    _actualKey['element0d'] = server_data['PCA'][_actualKey['element0'] - 2001]['description'];
                  }
                  if (_actualKey['element1'] > 2000) {
                    _actualKey['element1d'] = server_data['PCA'][_actualKey['element1'] - 2001]['description'];
                  }
                  returnArray[i] =
                  {
                    name: longest_substring_finder(_actualKey['element0d'], _actualKey['element1d']),
                    data: { id: 'cover_' + _actualKey['element0'] + "_" + _actualKey['element1']+'_'+_serverID },
                  }
                  i++;
                }
              }
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
