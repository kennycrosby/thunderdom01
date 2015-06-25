angular.module('thunderdome.controllers', [])

.controller('LoginCtrl', function ($scope, $ionicModal, $firebaseAuth, $ionicLoading, $rootScope, $state, $cordovaStatusbar) {
    console.log('Login Controller Initialized');

    var ref = new Firebase($scope.firebaseUrl);
    var auth = $firebaseAuth(ref);

    $ionicModal.fromTemplateUrl('templates/signup.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.createUser = function (user) {
      console.log("Create User Function called");
      if (user && user.email && user.password && user.displayname) {
        $ionicLoading.show({
            template: 'Signing Up...'
        });
        auth.$createUser({
            email: user.email,
            password: user.password
        }).then(function (userData) {
            alert("User created successfully!");
            ref.child("users").child(userData.uid).set({
                email: user.email,
                displayName: user.displayname,
                image : "defaultuser.jpg",
                zone : 0,
                id : utils.guid(),
                lastSeen: Firebase.ServerValue.TIMESTAMP,
                unlocked: false,
                locationCount: 0
            });
            $ionicLoading.hide();
            $scope.modal.hide();
        }).catch(function (error) {
            alert("Error: " + error);
            $ionicLoading.hide();
        });
      } else
        alert("Please fill all details");
    }

    $scope.signIn = function (user) {

      if (user && user.email && user.pwdForLogin) {
        $ionicLoading.show({
            template: 'Signing In...'
        });
        auth.$authWithPassword({
            email: user.email,
            password: user.pwdForLogin
        }).then(function (authData) {

            $rootScope.userRef = new Firebase($scope.firebaseUrl + 'users/' + authData.uid);

            console.log("Logged in as:" + authData.uid);
            ref.child("users").child(authData.uid).once('value', function (snapshot) {
                var val = snapshot.val();
                // To Update AngularJS $scope either use $apply or $timeout
                $scope.$apply(function () {
                    $rootScope.displayName = val;
                    $rootScope.currUser = val;
                });
            });
            $ionicLoading.hide();
            $state.go('tab.dash');
        }).catch(function (error) {
            alert("Authentication failed:" + error.message);
            $ionicLoading.hide();
        });
      } else
        alert("Please enter email and password both");
    }
})

.controller('DashCtrl', function ($scope, $rootScope, $ionicModal, $cordovaLocalNotification, Dash, Users, Zones) {

  

  $cordovaLocalNotification.cancelAll().then(function (result) {
    // ...
  });

  // Welcome to mod!!!!!!!
  $rootScope.$on('$cordovaLocalNotification:click',
  function (theevent, notification, state) {

    if (notification.id === '11') {
      $scope.modal.show();  
    };

    console.log(notification);
    console.log('notification ID', notification.id);
    console.log('notification time', notification.at);
    console.log('state', state);
  });

  // $scope.scheduleDelayedNotification = function () {
  //   var now = new Date().getTime();
  //   var _30SecondsFromNow = new Date(now + 30 * 1000);

  //   $cordovaLocalNotification.schedule({
  //     id: 20,
  //     title: 'Title here',
  //     text: '30 sec here',
  //     at: _30SecondsFromNow
  //   }).then(function (result) {
  //     // ...
  //   });
  // };

  // $scope.scheduleEveryMinuteNotification = function () {
  //   $cordovaLocalNotification.schedule({
  //     id: 30,
  //     title: 'Title here',
  //     text: 'minute Text here',
  //     every: 'minute'
  //   }).then(function (result) {
  //     // ...
  //   });
  // };

  $scope.continue = function() {
    $scope.modal.hide();
  }

  $ionicModal.fromTemplateUrl('templates/welcome.html', {
    scope: $scope
  }).then(function (modal) {
    $scope.modal = modal;
  });

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  // $scope.$on('$ionicView.enter', function(e) {
  //   console.log('entered this view');
  // });

  // Monitor for beacons
  // $scope.monitor = function() {
  //   Dash.monitor();
  // }

  // Dash.monitor();

  estimote.beacons.startMonitoringForRegion(
  {
    'identifier': 'MyRegion',
    'uuid': 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'
  },
  function(regionState){

    // console.log('regionState', regionState);
    // console.log('You are ' + regionState.state + ' the region');
    //alert('You are ' + regionState.state + ' the region');

    if (regionState.state === 'inside') {

      $scope.modal.show();
      
      // START SCANNING AND SET THE ZONE FOR THIS USER
      Zones.scan($rootScope.userRef);

      // Check the user into the space
      $rootScope.userRef.child('unlocked').set(true);
      $rootScope.userRef.child('lastSeen').set(Date.now());

      // Set the location count
      $rootScope.userRef.child('locationCount').once('value', function(snap) {
        var locationcount = snap.val();
        ++locationcount;
        $rootScope.userRef.child('locationCount').set(locationcount);
        $scope.user.locationCount = locationcount;
        $scope.$apply();
      });

      var now = new Date().getTime();
      var _30SecondsFromNow = new Date(now + 30 * 1000);

      $cordovaLocalNotification.schedule({
        id: 11,
        title: 'Welcome to mod!',
        text: 'You are now checked in.'
      }).then(function (result) {
        // ...
        console.log('boom 3');
      });

    } else if (regionState.state === 'outside') {

      // stop scanning for interior zones
      Zones.stopScan();

      // Update the user data in firebase
      $rootScope.userRef.child('unlocked').set(false);
      $rootScope.userRef.child('lastSeen').set(Date.now());
      $rootScope.userRef.child('zone').set(0);

      var now = new Date().getTime();
      var _30SecondsFromNow = new Date(now + 30 * 1000);

      $cordovaLocalNotification.schedule({
        id: 22,
        title: 'You left mod!',
        text: 'We checked you out.'
      }).then(function (result) {
        // ...
        console.log('boom 4');
      });

    };

  },
  function(error){
    console.log('error', error);
  });

  $scope.users = Users.all();

})

.controller('MapCtrl', function ($scope, $state, Users, MapZones) {
  
  $scope.zones = {};
  var usersRef = new Firebase($scope.firebaseUrl + 'users/');

  // Set the scope with the users ref
  usersRef.on('value', function(snap) {
    var users = snap.val();
    $scope.zones = MapZones.getZones(users);
  });

  // When something is changed update the scope
  usersRef.on('child_changed', function(snap) {
    var users = snap.val();
    usersRef.child(userId).on('value', function(snap) {
      $scope.zones = MapZones.getZones(users);
    });
  });
})

.controller('UserDetailCtrl', function ($scope, $stateParams, Users) {
  $scope.user = Users.get($stateParams.userId);
})

// Custom Filters
.filter('yesNo', function() {
  return function(input) {
    return input ? 'yes' : 'no';
  }
});
