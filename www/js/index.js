// (c) 2014-2015 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global mainPage, deviceList, refreshButton */
/* global detailPage, buttonState, ledButton, disconnectButton */
/* global ble, cordova  */
/* jshint browser: true , devel: true*/
'use strict';

var arrayBufferToInt = function (ab) {
    var a = new Uint8Array(ab);
    return a[0];
};

// i must be < 256
function asHexString(i) {
    var hex;

    hex = i.toString(16);

    // zero padding
    if (hex.length === 1) {
        hex = "0" + hex;
    }

    return "0x" + hex;
}


function parseAdvertisingData(bytes) {
    var length, type, data, i = 0, advertisementData = {};

    while (length !== 0) {

        length = bytes[i] & 0xFF;
        i++;

        type = bytes[i] & 0xFF;
        i++;

        data = bytes.slice(i, i + length - 1); // length includes type byte, but not length byte
        i += length - 2;  // move to end of data
        i++;

        advertisementData[type] = data;
    }

    return advertisementData;
}

// RFduino advertises the sketch its running in the Manufacturer field 0xFF
// RFduino provides a UART-like service so all sketchs look the same (0x2220)
// This RFduino "service" name is used to different functions on the boards
var getService = function(scanRecord,value) {
    var mfgData;

    if (cordova.platformId === 'ios') {
        mfgData = arrayBufferToIntArray(scanRecord.kCBAdvDataManufacturerData);
    } else { // android
        var ad = parseAdvertisingData(arrayBufferToIntArray(scanRecord));
        mfgData = ad[value];
    }

    if (mfgData) {
      // ignore 1st 2 bytes of mfg data
      return mfgData.slice(2);//bytesToString(mfgData.slice(2));
    } else {
      return "";
    }
};

// Convert ArrayBuffer to int[] for easier processing.
// If Uint8Array.slice worked, this would be unnecessary
var arrayBufferToIntArray = function(buffer) {
    var result;

    if (buffer) {
        var typedArray = new Uint8Array(buffer);
        result = [];
        for (var i = 0; i < typedArray.length; i++) {
            result[i] = typedArray[i];
        }
    }

    return result;
};

var bytesToString = function (bytes) {
    var bytesAsString = "";
    for (var i = 0; i < bytes.length; i++) {
        bytesAsString += String.fromCharCode(bytes[i]);
    }
    return bytesAsString;
};

var beacons = []; 

function Beacon(id, name, rssi, advertising) {
    this.id = id;
	this.name = name;
	this.rssi = rssi;
    this.advertising = advertising;
}

// Here is the total App that doing the job:
var app = {
    initialize: function() {
        this.bindEvents();
		//bluetoothle.initialize();//console.log("initialize success"), console.log("initialize error"), false);
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
        deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
    },
    onDeviceReady: function() {
        app.refreshDeviceList();
    },
    
	refreshDeviceList: function() {
		
       // deviceList.innerHTML = ''; // empties the list
		ble.scan([], 1, app.onDiscoverDevice, app.onError);
		//bluetoothle.startScan();
		//bluetoothle.discover(app.onDiscoverDevice, app.onError, null);
		
		setTimeout(function(){doit();}, 1000);
    },
    onDiscoverDevice: function(device) {
			
		var add = true;
		
		for	(var i=0; i<beacons.length; i++) {
    		if(beacons[i]!=null){
                if(beacons[i].id == device.id){ // Here we get the device id
                    add=false;
                    beacons[i].rssi = device.rssi; // Here we get the device rssi
                }
			}
		} 
		
		if(add){ //Add new items to the found iBeacon List
            // device name: MAC addr
            // device id  : Name of the BLE device
			beacons.push(new Beacon(device.id, device.name, device.rssi,device.advertising));
		}
		
		app.drawList();
		
    },
	drawList: function() {
		deviceList.innerHTML = ''; // empties the list
		
		//if(beacons.length>0){
		for	(var i=0; i<beacons.length; i++) {
			
            // Here will define how single item looks like:
    		var listItem = document.createElement('li'),
			html = '<b>' + beacons[i].name + '</b><br/>' +
			'RSSI: ' + beacons[i].rssi + '<br/>' +
			'TxPower: ' + getService(beacons[i].advertising,0x16) + '<br/>' +
			'Advertising: ' + getService(beacons[i].advertising,0xFF) + '<br/>' +
			'DeviceID: ' + beacons[i].id;
	
			listItem.dataset.deviceId = beacons[i].id;
			listItem.innerHTML = html;
			deviceList.appendChild(listItem);
			
		}
		//}
		
    },onError: function(reason) {
        alert("ERROR: " + reason); // real apps should use notification.alert
    }
};

//$( document ).onDeviceReady(function(){
	//doit();
	
	function doit(){
		app.refreshDeviceList();
		//setTimeout(function(){doit();}, 5000);
	};
//});
