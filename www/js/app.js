// Ionic thunderdome App
var firebaseUrl = "https://intense-torch-5728.firebaseio.com/";

function onDeviceReady() {
  console.log('device ready 1');
  angular.bootstrap(document, ['thunderdome']);
}

// Registering onDeviceReady callback with deviceready event
document.addEventListener("deviceready", onDeviceReady, false);

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'thunderdome' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'thunderdome.services' is found in services.js
// 'thunderdome.controllers' is found in controllers.js
angular.module('thunderdome', ['ionic', 'thunderdome.controllers', 'thunderdome.services', 'firebase', 'angularMoment', 'ngCordova'])

.run(function ($ionicPlatform, $rootScope, $location, Auth, $ionicLoading, $cordovaStatusbar) {
  $ionicPlatform.ready(function() {

    console.log('ionic ready');

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
    }
    
    // To Resolve Bug
    ionic.Platform.fullScreen();

    document.addEventListener("deviceready", function() {

      if(device.platform === "iOS") {
        window.plugin.notification.local.promptForPermission();
        //window.plugin.notification.local.registerPermission();
      }

      console.log('device ready 2');
      $cordovaStatusbar.show();

      //setTimeout(function() {
        //if (window.StatusBar) {
          // console.log('statusbar');
          // $cordovaStatusbar.show();
          // $cordovaStatusbar.overlaysWebView(false);
          // $cordovaStatusbar.styleHex('#000');
        //}
      //}, 300);

    }, false);

    $rootScope.firebaseUrl = firebaseUrl;
    $rootScope.displayName = null;
    $rootScope.userRef = null;

    Auth.$onAuth(function (authData) {
      if (authData) {
        console.log("Logged in as:", authData.uid);
        //$location.path('/dash');
      } else {
        console.log("Logged out");
        $ionicLoading.hide();
        $location.path('/login');
      }
    });

    $rootScope.logout = function () {
      console.log("Logging out from the app");
      $ionicLoading.show({
          template: 'Logging Out...'
      });
      Auth.$unauth();
    }

    $rootScope.$on("$stateChangeError", function (event, toState, toParams, fromState, fromParams, error) {
      // We can catch the error thrown when the $requireAuth promise is rejected
      // and redirect the user back to the home page
      if (error === "AUTH_REQUIRED") {
          $location.path("/login");
      }
    });

  });
})

.config(function ($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // State to represent Login View
  .state('login', {
    url: "/login",
    templateUrl: "templates/login.html",
    controller: 'LoginCtrl',
    resolve: {
      // controller will not be loaded until $waitForAuth resolves
      // Auth refers to our $firebaseAuth wrapper in the example above
      "currentAuth": ["Auth",
        function (Auth) {
            // $waitForAuth returns a promise so the resolve waits for it to complete
            return Auth.$waitForAuth();
      }]
    }
  })

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html",
    resolve: {
      // controller will not be loaded until $requireAuth resolves
      // Auth refers to our $firebaseAuth wrapper in the example above
      "currentAuth": ["Auth",
        function (Auth) {
          // $requireAuth returns a promise so the resolve waits for it to complete
          // If the promise is rejected, it will throw a $stateChangeError (see above)
          return Auth.$requireAuth();
      }]
    }
  })

  // Each tab has its own nav history stack:
  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })

  .state('tab.user-detail', {
    url: '/dash/:userId',
    views: {
      'tab-dash': {
        templateUrl: 'templates/user-detail.html',
        controller: 'UserDetailCtrl'
      }
    }
  })

  .state('tab.map', {
    url: '/map',
    views: {
      'tab-map': {
        templateUrl: 'templates/tab-map.html',
        controller: 'MapCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
