angular.module('OsmoApp.controllers', [])
.controller('MainController', function($scope){
	$scope.loggedIn = false;
	/*
	 * Converts abbreviated location to full location name
	 * @param {string} locationId : abbreviated location
	 */
	$scope.fullLocationName = function(locationId) {
		var locationName = "";
		switch(locationId){
			case "SJ":
				locationName = "San Jose, CA | USA";
				break;
			case "SF":
				locationName = "San Francisco, CA | USA";
				break;
			case "SD":
				locationName = "San Diego, CA | USA";
				break;
			case "TX":
				locationName = "Richardson, TX | USA";
				break;
			case "SEATTLE":
				locationName = "Seattle, WA | USA";
				break;
			case "OREGON":
				locationName = "Portland, OR | USA";
				
				break;
			case "GALWAY":
				locationName = "Galway | Ireland";
				break;
			case "DUBLIN":
				locationName = "Dublin | Ireland";
				break;
			case "OSLO":
				locationName = "Oslo | Norway";
				break;
			case "SHANGHAI":
				locationName = "Shanghai | China";
				break;
			case "KOREA":
				locationName = "Seoul | Korea";
				break;
			default:
				locationName = "";
		}
		return locationName;
	};
})
.controller('SelfieUpload', ['Upload', function(Upload){

}]);