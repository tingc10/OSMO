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
angular.module('OsmoApp', ['OsmoApp.directives','OsmoApp.controllers', 'ngFileUpload'])
.filter("trustUrl", ['$sce', function ($sce) {
  return function (recordingUrl) {
    return $sce.trustAsResourceUrl(recordingUrl);
  };
}]);