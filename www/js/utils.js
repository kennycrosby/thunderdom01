var utils = utils || {

  guid : function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  },

  mode : function(array){
      if(array.length == 0)
        return null;
      var modeMap = {};
      var maxEl = array[0], maxCount = 1;
      for(var i = 0; i < array.length; i++)
      {
        var el = array[i];
        if(modeMap[el] == null)
          modeMap[el] = 1;
        else
          modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
          maxEl = el;
          maxCount = modeMap[el];
        }
      }
      return parseInt(maxEl);
  },
  poll : function(fn, callback, errback, timeout, interval) {

    var endTime = Number(new Date()) + (timeout || 2000);
    interval = interval || 100;

    (function p() {
      // If the condition is met, we're done! 
      if(fn()) {
          callback();
      }
      // If the condition isn't met but the timeout hasn't elapsed, go again
      else if (Number(new Date()) < endTime) {
          setTimeout(p, interval);
      }
      // Didn't match and too much time, reject!
      else {
          errback(new Error('timed out for ' + fn + ': ' + arguments));
      }
    })();
  }
};



// Usage:  ensure element is visible
// utils.poll(
//   function() {
//       return document.getElementById('lightbox').offsetWidth > 0;
//       console.log('polling');
//   },
//   function() {
//       // Done, success callback
//   },
//   function() {
//       // Error, failure callback
//   },
//   500000,
//   5000
// );



