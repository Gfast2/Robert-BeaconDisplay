function BeaconEvent(txPower, rssi, dataKey) {
    this.txPower = txPower;
	this.rssi = rssi;
    this.dataKey = dataKey;
}

//https://github.com/RadiusNetworks/android-ibeacon-service/blob/4185a5bd0c657acaf145098a09466bb34a144557/src/main/java/com/radiusnetworks/ibeacon/IBeacon.java

BeaconEvent.accuracy = function() {
	
	var ratio = this.rssi / this.txPower;
	
	if (ratio < 1.0) {
		return Math.pow(ratio,10);
	}
	else {
		return  (0.89976)*Math.pow(ratio,7.7095) + 0.111;
	}
}