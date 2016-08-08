function detectIE() {
  var ua = window.navigator.userAgent;

  var msie = ua.indexOf('MSIE ');
  if (msie > 0) {
    // IE 10 or older => return version number
    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }

  var trident = ua.indexOf('Trident/');
  if (trident > 0) {
    // IE 11 => return version number
    var rv = ua.indexOf('rv:');
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }

  var edge = ua.indexOf('Edge/');
  if (edge > 0) {
   // Edge (IE 12+) => return version number
   return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }

  // other browser
  return false;
}

if(detectIE()){
	alert("Any browser but Internet Explorer! I recommend Chrome or Firefox.");
}

/*
 *	Runs callback after src has been loaded
 *	@params {string} src : image you want to load
 *	@params {function} callback: the function you want to run after image is loaded
 */
if(!window.loadImageCallback){
	window.loadImageCallback = function(src, callback){
		var image = new Image();  
		image.src = src;
		image.onload = function() { 
		  //Image loaded- set the background image to it
		  callback({msg: "success", image: image});
		};
		image.onerror = function() {
		  //Image failed to load- use default
		  callback({msg:"imageload failed"});
		};
	};
}
	
// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

/**
 * Array.prototype.[method name] allows you to define/overwrite an objects method
 * needle is the item you are searching for
 * this is a special variable that refers to "this" instance of an Array.
 * returns true if needle is in the array, and false otherwise
 */
Array.prototype.contains = function ( needle ) {
  for (i in this) {
    if (this[i] == needle) return true;
  }
  return false;
};


angular.module('OsmoApp', ['OsmoApp.directives','OsmoApp.controllers', 'ngFileUpload'])
.filter("trustUrl", ['$sce', function ($sce) {
  return function (recordingUrl) {
    return $sce.trustAsResourceUrl(recordingUrl);
  };
}]);