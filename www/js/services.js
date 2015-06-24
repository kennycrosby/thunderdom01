angular.module('thunderdome.services', ['firebase'])

.factory("Auth", ["$firebaseAuth", "$rootScope",
    function ($firebaseAuth, $rootScope) {
      console.log('auth');
            var ref = new Firebase(firebaseUrl);
            return $firebaseAuth(ref);
}])

.factory('Dash', ['$rootScope', function ($rootScope) {
  return {

    regionObj : {
      'identifier': 'MyRegion',
      'uuid': 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'
    },

    monitor : function() {

      console.log('got here');

      ////////////////////////////////////////////
      // // MONITORING TEST
      estimote.beacons.startMonitoringForRegion(
        this.regionObj,
        this.onMonitor,
        function(error){
          console.log('error', error);
        });
      ////////////////////////////////////////////

    },
    onMonitor : function(regionState){
      console.log('regionState', regionState);

      console.log('You are ' + regionState.state + ' the region');
      alert('You are ' + regionState.state + ' the region');

      if (regionState.state === 'inside') {
        console.log('inside inside if');
        $rootScope.userRef.child('unlocked').set(true);
        $rootScope.userRef.child('lastSeen').set(Date.now());

        var now = new Date().getTime();
        var _30SecondsFromNow = new Date(now + 30 * 1000);

        $cordovaLocalNotification.schedule({
          id: 1,
          title: 'Welcome to mod!',
          text: 'You are inside mod',
          at: _30SecondsFromNow
        }).then(function (result) {
          // ...
          alert('boom 3');
        });

      } else if (regionState.state === 'outside') {
        console.log('Inside OUTSIDE if');
        $rootScope.userRef.child('unlocked').set(false);

      };

      //alert('regionState', regionState)
      if (window.mAppInBackground){
        console.log('app is running in background');
        window.plugin.notification.local.add({
            message: 'Region state: ' + regionState.state,
            sound: null 
        });
      }

    }
  }
}])

.factory('Zones', function() {
  return {
    zonesObj : {
      1 : [ 39199, 44239, 47979 ], //zone 1 beacons major
      2 : [ 49839, 17343 ],        //zone 2 beacons major
      3 : [ 38523, 5356, 11828 ],  //zone 3 beacons major the unlock is 11828
      4 : [ 48980, 8986 ],         //zone 4 beacons major
      5 : [ 27715, 20669 ]         //zone 5 beacons major
    },
    regionObj : {
      'identifier': 'MyRegion',
      'uuid': 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'
    },
    scan : function(userRef) {

      var self = this;
      var zone = 0,
          count = 0,
          sample = [],
          sampleRate = 5;

      // Start scanning.
      estimote.beacons.startRangingBeaconsInRegion(
        this.regionObj, // Empty region matches all beacons.
        //onScan
        function(beaconInfo) {

          // Sort beacons by signal strength.
          beaconInfo.beacons.sort(function(beacon1, beacon2) {
            return beacon1.rssi > beacon2.rssi; });

          // Closest Beacon
          var closestMajor = beaconInfo.beacons[0].major;

          if ( count+1 <= sampleRate ) {

            // Add the zone to the zone sample we are taking
            for (var key in self.zonesObj) {
              if (self.zonesObj.hasOwnProperty(key)) {
                for (var i = self.zonesObj[key].length - 1; i >= 0; i--) {
                  if (closestMajor === self.zonesObj[key][i]) {
                    console.log('match', key);
                    sample.push(key);
                    count++;
                  }; 
                };
              }
            }

          } else {

            // get the most occuring zone and set the zone
            var zone = utils.mode(sample);
            if (typeof zone === 'number' && beaconInfo.beacons.length > 1) {
              // Set the Zone for that user
              userRef.child('zone').set(zone);
              count = 0;
              sample = [];
            };

          }
        },
        //onError
        function(errorMessage){
          console.log(errorMessage);
        });
    },

    stopScan : function() {
      console.log('calling stopscan');
      estimote.beacons.stopRangingBeaconsInRegion(this.regionObj);
    }
  }
})

.factory('Users', function ($firebase) {
  // Might use a resource here that returns a JSON array
  var ref = new Firebase(firebaseUrl);
  var users = $firebase(ref.child('users')).$asArray();

  return {
    all: function () {
      return users;
    },
    get: function(userId) {
      console.log(userId);
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
          return users[i];
        }
      }
      return null;
    }
  }
})

.factory('MapZones', function ($firebase) {
  return {
    getZones: function(users) {
      var zones = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[] };
      for (var key in users) {
        if (users.hasOwnProperty(key)) {
          zones[users[key].zone].push(users[key]);
        }
      }
      return zones;
    }
  }
});
