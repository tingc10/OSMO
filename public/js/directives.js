angular.module('OsmoApp.directives', [])
.directive('mosaic', function($timeout, $http, $location){
	return {
		retrict: 'A',
		templateUrl: './templates/mosaic.html',
		link: function(scope, element, attrs) {
			scope.images = [];
			scope.undisplayedMedia = [];
			// scope.unloadedImages = 40;
			scope.loremFlickr = {
				link:'//loremflickr.com/320/240/office,people,collaboration', 
				user: null
			};

			var numAwaitingResponse = 0;
			var stampElements = element[0].getElementsByClassName('stamp');
			var osmoImage = element[0].getElementsByClassName('osmo-image')[0];
			var osmoHeight;
			var params = $location.search();
			
			/*
			 * Triggers packery after DOM is rendered
			 */
			var layoutAfterRender = function(){
				$timeout(function(){
					scope.pckry.layout();

				});
			};
			scope.allUsersWithMedia;
			
			/*
			 *	Waits until image is loaded before loading next image
			 *	@params {int} numToLoad : number of images left to load
			 */
			var loadHelper = function(){
				$timeout(function(){
					var lengthUndisplayed = scope.undisplayedMedia.length,
							randomIndex;
					// if(scope.unloadedImages){
						// scope.unloadedImages--;
					if(lengthUndisplayed > 1) {
						randomIndex = Math.floor(Math.random()*lengthUndisplayed);
						var tmp = scope.undisplayedMedia[randomIndex];
						scope.undisplayedMedia.splice(randomIndex, 1);
						if(!params.focus && !scope.currentVideo && tmp.user.videoUri){
							scope.getVideo(tmp.user.videoUri, function(data){
								if(data.files[0]){
									$timeout(function(){
										scope.currentVideo = data.files[0].link;
									});
									
									
								} else {
									
									console.log('no preview available');
								}
							});
						}
						loadImageCallback(tmp.link, function(response){
							
							if(response.msg == "success") {
								tmp.link = response.image.src;
								scope.images.push(tmp);
							} else {
								console.log('image load error...');
							}
							scope.$apply();
							loadHelper();
						});
							
					} 
					
				});
					
			};

			/*
			 * Enter fullscreen mode after clicking on video
			 */
			scope.fullScreen = function() {
				
				var videoElt = element.find('video')[0];

			  if(scope.currentVideo){
			  	if (videoElt.mozRequestFullScreen) {
				    videoElt.mozRequestFullScreen();
				  } else if (videoElt.webkitRequestFullScreen) {
				    videoElt.webkitRequestFullScreen();
				  } 
			  }
			   
			}

			/*
			 * Get all users who have the Osmo at each location
			 * @params {function} callback : takes a parameter users who have OSMO
			 */
			var getAllUsersWithOsmo = function(callback) {
				$http({
					method: "GET",
					url: "/osmo/db/users/hasOSMO"
				}).then(function(response){
					
					callback(response.data.users);
				}, function(err){
					console.log("Could not get users", err);
				});
			};
			
			/*
			 * Generates a string of the status of the location
			 * @param {obj} location : the location object containing all necessary info
			 */
			scope.legibleStatus = function(location){
				if(location.handoffTo) {
					return location.userId + " selected " + location.handoffTo;
				} else {
					return location.userId;
				}
			};

			/*
			 * Updates the information regarding all the OSMO locations
			 * @params {obj} locations : locations with information about who has the Osmo
			 */
			var updateOsmoLocations = function(locations){
				for(var location in locations){
					locations[location].name = location;
				}
				scope.osmoLocations = locations;
			};

			/*
			 *	Gets all the possible media that can be displayed and cache video element
			 */
			var initializeAfterRender = function(){
				getAllUsersWithOsmo(function(locations){
					$timeout(function(){
						updateOsmoLocations(locations);
					});
				});

				getAllUsersWithMedia(function(response){
					scope.allUsersWithMedia = response.data;
					
					console.log(scope.allUsersWithMedia);
					for(var i = 0, length = scope.allUsersWithMedia.length; i < length; i++) {
						var user = scope.allUsersWithMedia[i];
						scope.undisplayedMedia.push({link:user.selfieLocation, user: user});
						if(user.videoUri) {
							if(!user.vimeoThumbnail) {
								// the user has a video uploaded but vimeoThumbnail has not been saved
								(function(user) {
									numAwaitingResponse++;
									cacheUserVimeoThumbnail(user, function(response){
										if(response.msg == "success"){
											
											scope.undisplayedMedia.push({link:response.link, user: user});
										} else {
											console.log(response);
										}
										numAwaitingResponse--;
										if(numAwaitingResponse == 0){
											// performInitialFill();
											loadHelper();
										}
										// if this callback is the final response to the last user,
										//	do a random selection
										
									});
									
								})(user);
								
							} else {
								scope.undisplayedMedia.push({link: user.vimeoThumbnail, user: user});

							}
						}
					}
					if(numAwaitingResponse == 0){
						// performInitialFill();
						loadHelper();
					}
				});
			};



			/*
			 *	Get all users from database and sends it to callback function
			 *	@params {function} callback : takes one parameter, the users array
			 */
			var getAllUsersWithMedia = function(callback){
				$http({
					method: "GET",
					url: "/osmo/db/users/media"
				}).then(function(response){
					
					callback(response);
				}, function(err){
					console.log("Could not get users", err);
				});
			};

			/*
			 *	Cache a user's thumbnail if Vimeo can supply it
			 *	@params {obj} user
			 *	@params {function} callback : on completion function
			 */
			var cacheUserVimeoThumbnail = function(user, callback){
				scope.getVideo(user.videoUri, function(data){
					scope.userVideoData = data;
					if(data.files[0]){
						scope.userVideoUrl = data.files[0].link;
						
					} else {
						console.log('no preview available');

					}

					if(data.pictures && data.pictures.sizes.length > 0){
						$http({
							method: "POST",
							url: "/osmo/db/"+user.userId+"/vimeoThumbnail",
							data: {vimeoThumbnail: data.pictures.sizes[3].link}
						}).then(function(response){
							
							console.log("update success with response", response);
							callback({msg: 'success', link: data.pictures.sizes[3].link});
						}, function(err){
							console.log('update failed with error', err);
							callback({msg: 'error', error: err});
							
						});
					} else {
						console.log("no pictures found...", data.pictures);
							callback({msg: 'error', data : data});

					}
					
				});
			};

			/*
				resets the size of osmo
			*/
			var getOsmoImageSize = function(){
				osmoHeight = osmoImage.offsetHeight;
				console.log(osmoHeight);
			};

			/*
			 *	Returns the undisplayed media, sets media as being displayed
			 *	and returns additional meta data about user
			 *	@params {obj}	user : user with all info
			 */
			var getUndisplayedMedia = function(user, callback){
				if(!user.selfieDisplayed) {
					user.selfieDisplayed = true;
					callback(user.selfieLocation);
				} else if(!user.videoUri) {
					user.vimeoThumbnailDisplayed = true;
					if(!user.vimeoThumbnail){
						// get and the user's thumbnail image

					} else {
						callback(user.vimeoThumbnail);
					}
					

				} else {
					callback(false);
				}
			};
			scope.$on('changeCurrentVideo', function(e, videoUri){
				scope.$apply(function(){
					scope.currentVideo = null;
					if(videoUri){
						scope.getVideo(videoUri, function(data){
							if(data.files[0]){
								$timeout(function(){
									scope.currentVideo = data.files[0].link;
								});
								
								
							} else {
								console.log('no preview available');
							}
						});
					}
					
				});
			});
			/*
			 *	Initializer
			 */
			$timeout(initializeAfterRender);
			
			/* 
				INIT PACKERY AND LISTENERS
			*/
			scope.pckry = new Packery(element[0], {
			  // options
			  itemSelector: '.video-wrappers',
			  "columnWidth": ".unit-reference"
			  // gutter: 2
			});
			scope.pckry.stamp(stampElements);
			scope.pckry.on( 'dragItemPositioned', function( draggedItem ) {
				layoutAfterRender();
			});
			scope.$on('packeryLayout', function(){
				layoutAfterRender();
				// scope.pckry.layout();
				// console.log("helloo??");
			});


			/* 
				WINDOW RESIZE
			*/
			function windowResize(){
				// scope.$apply(function(){
					scope.pckry.layout();
				// });
			};
			optimizedResize.add(windowResize);

			// first time run
			
			layoutAfterRender();
			scope.$on('layoutAfterRemoval', layoutAfterRender);
			scope.$on("setFocusIndex", function(e, index){
				scope.focusIndex = index;
			});
		}
	}
})
.directive('packeryItem', function($timeout, $location){
	return {
		restrict: 'A',
		templateUrl: './templates/video-wrapper.html',
		link: function(scope, element, attrs){
			var dragging = false,
					mousedown = false,
					imageLoaders = element[0].getElementsByClassName('image-loader'),
					topLayer = "front",
					pauseGetNew = false,
					params = $location.search();
			TweenLite.set(imageLoaders[1], {zIndex: 1});
			scope.linkOne = scope.image.link;

			
			/*
			 * Pins the user and sets the user's video to the osmo viewport
			 */
			var focusUser = function(){
				if(scope.image.user){
					scope.$emit('changeCurrentVideo', scope.image.user.videoUri);

				}
				console.log(scope.image.user);
				scope.$emit("setFocusIndex", scope.$index);
				$timeout(function(){
					scope.pckry.fit(element[0], 0, 0);
				});
			}
			/*
			 *	Loads image via callback function then fades out layer on top
			 */
			var setNewLink = function(imageInfo, callback){
				
				
				var link = imageInfo.link;
				scope.image = imageInfo;
				if(topLayer == "front"){
					scope.linkTwo = link;
				} else {
					scope.linkOne = link;
				}
				loadImageCallback(link, function(response){
					if(response.msg == "success"){
						$timeout(function(){
							var tween = new TimelineLite({paused: true});
							var front, back;
							if(topLayer == "front"){
								topLayer = "back";
								front = imageLoaders[0];
								back = imageLoaders[1];
							} else {
								topLayer = "front";
								front = imageLoaders[1];
								back = imageLoaders[0];
							}
							tween.set(back, {autoAlpha: 1})
							.to(front, 0.3, {autoAlpha: 0})
							.set(front, {zIndex: 1})
							.set(back, {zIndex: 2});
							tween.play();
						});

					} else {
						console.log('failed to load image');
					}
					callback();
				});
				
				
				
			};
			/*
				Random Assign Size
			*/
			switch(Math.floor(Math.random()*3)) {
				case 0:
					scope.randomSize = "small";
					break;
				case 1:

					scope.randomSize = "wide";
					break;
				case 2:
					scope.randomSize = "extra-wide";
					break;
			}
			var draggie,
			init = function(){

				scope.pckry.appended(element[0]);
				draggie = new Draggabilly( element[0] );
				scope.pckry.bindDraggabillyEvents(draggie);
				scope.$emit('packeryLayout');
				element.on('mousedown',function(){
					console.log("mousedown");
					$timeout(function(){
						mousedown = true;
					});
						
					
				});
				element.on('click', function(){
					focusUser();
					
					
				});
				element.on('mouseup', function(){
					
					$timeout(function(){
						mousedown = false;
						if(dragging) {
							scope.$emit('packeryLayout');
						}
						dragging = false;
						console.log("mouseup");
					});
				});
				element.on('mousemove', function(){
					$timeout(function(){
						if(mousedown){
							dragging = true;
							console.log("dragging");
						}
						
					});
					
				});
				element.on('$destroy', function(){
					scope.pckry.remove(element[0]);
					scope.$emit('layoutAfterRemoval');
					
				});
				if(params.focus && params.focus == scope.image.user.userId){
					$timeout(function(){
						focusUser();

					});
				}
			};

			try {
				init();
			} catch(err) {
				$timeout(function(){
					init();
				});
				return console.log(err);
			}
			/*
			 *	Swap out the current image and information for something undisplayed
			 */
			var getNewImage = function(){
				var randomDelay = parseInt(Math.random()*20000)+20000;
				$timeout(function(){
					// if(scope.unloadedImages == 0){

					if(scope.$index != scope.focusIndex){
						var currentImageInfo = scope.image,
								length = scope.undisplayedMedia.length;
						// check if there are undisplayed items that can be swapped out
						if(length > 0){
							var randomIndex = Math.floor(Math.random()*length);
							var imageInfo = scope.undisplayedMedia[randomIndex];
							setNewLink(imageInfo, getNewImage);
							scope.undisplayedMedia.splice(randomIndex, 1);
							if(currentImageInfo.user){
								// this is a real item (as opposed to filler image)
								// return this info back to undisplayedMedia
								scope.undisplayedMedia.push(currentImageInfo);
							}
						} else {
							// wait for an image to appear
							getNewImage();
						}
						
					} else {
						getNewImage();
					}
					
						
					// }
				}, randomDelay);
				
			};
			getNewImage();

		}
	}
})
.directive('loginPanel', function($location, $http, $timeout){
	return {
		restrict: "A",
		templateUrl: './templates/login-panel.html',
		link: function(scope, element, attrs) {
			var params = $location.search();
			/**
			 *	Make registration response hide
			 */
			var clearResponse = function(){
				$timeout(function(){
					scope.registrationResponse = "";
					scope.loginResponse = "";
				}, 2000);
			};
			scope.checkEmail = false;
			scope.register = false;
			scope.showForgetPassword = false;
			/*
			 *	Request send password link
			 */
			scope.resetPassword = function(){
				console.log(scope.userId);
				$http({
					method: "GET",
					url: "/reset/user/" + scope.userId,
				}).then(function(response){
					scope.loginResponse = "Please check your email for reset link!";
					console.log(response);
					// scope.checkEmail = true;
					
				}, function(response){
					scope.loginResponse = "Yikes! A network error occurred, try again in a bit...";
				});
			};
			/*
			 *	Waits for enter button and logs user in
			 */
			scope.monitorSubmission = function(e){
				// enter button
				if(e.keyCode == 13) {
					scope.login();
				}
			};
			/**
			 *	Toggle Login panel view
			 *	@param {boolean} show - whether or not to show or hide
			 */
			scope.toggleLogin = function(show){
				if(show) {
					TweenLite.to(element, 0.3, {autoAlpha: 1});
				} else {
					TweenLite.to(element, 0.3, {autoAlpha: 0, onComplete:function(){
						scope.$apply(function(){
							scope.register = false;
						});
					}})
				}
			};
			/*
			 *	Login to account with given credentials
			 */
			scope.login = function(){
				$http({
					method: "POST",
					url: "/login",
					data: {
						userId: scope.userId,
						password: scope.password
					}
				}).then(function(response){
					console.log(response);
					if(response.data.msg =="Session saved"){
						



						scope.toggleLogin(false);
						if(params.n === "all-users") {
							scope.navigate("all-users");
						} else {
							scope.navigate("dashboard");
						}
						
						$timeout(function(){
							scope.userInit(response);
						});
						
					} else if(response.data == "unregistered"){
						scope.loginResponse = "This account is not registered yet";
						clearResponse();
					} else {
						scope.loginResponse = "Wrong Username or Password";
						clearResponse();
					}
				}, function(err){
					console.log(err);
				});
			};
			/**
			 *	Request server to see if username is set up
			 */
			scope.submitRegistration = function(){
				$http({
					method: "GET",
					url: "/register/user/" + scope.userId,
				}).then(function(response){
					if(response.data == "unregistered") {
						scope.registrationResponse = "Please check your email to continue setup!";
						scope.checkEmail = true;
					} else if(response.data == "registered"){
						scope.registrationResponse = "This account is already registered!";
						clearResponse();
					} else {
						scope.registrationResponse = "Couldn't find a matching ID in CCDS";
						clearResponse();
					}
				}, function(response){
					scope.registrationResponse = "Yikes! A network error occurred, try again in a bit...";
					clearResponse();
				});
			};
		}
	}
})
.directive('registration', function($location, $http, $window){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			scope.showRegistration = false;
			var params = $location.search();
			if(params.u && params.v) {
				$http({
					method: "GET",
					url: "/register/user/"+params.u+"/"+params.v
				}).then(function(response){
					if(response.data == "verified"){
						scope.userId = params.u;
						scope.showRegistration = true;
					} else if(response.data == "unverified") {
						scope.registrationMessage = "You are not authorized to register this account";
					} else {
						scope.registrationMessage = "Oops, you stumbled accross the wrong page...";

					}
				}, function(response){
					console.log("Network error...");
				});
			} else {
				scope.registrationMessage = "Oops, you stumbled accross the wrong page...";
			}
			scope.createAccount = function(){
				if(scope.password.length > 0 && scope.name.length > 0) {
					
					$http({
						method: "POST",
						url: "/osmo/db/users",
						data: {
							userId : scope.userId,
							password: scope.password,
							name: scope.name
						}
					}).then(function(response){
						console.log(response);
						if(response.data == "user created"){
							$window.location.href = '/dashboard'
						}
					}, function(err){

						console.log("Something went wrong :" + err);
					});
				} else {
					console.log("Incomplete form");
					return;
				};
				
			};
		}
	}
})
.directive('reset', function($location, $http, $window){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			scope.showRegistration = false;
			var params = $location.search();
			if(params.u && params.v) {
				$http({
					method: "GET",
					url: "/register/user/"+params.u+"/"+params.v
				}).then(function(response){
					if(response.data == "verified"){
						scope.userId = params.u;
						scope.showRegistration = true;
					} else if(response.data == "unverified") {
						scope.registrationMessage = "You are not authorized to reset the password for this account";
					} else {
						scope.registrationMessage = "Oops, you stumbled accross the wrong page...";

					}
				}, function(response){
					console.log("Network error...");
				});
			} else {
				scope.registrationMessage = "Oops, you stumbled accross the wrong page...";
			}
			scope.resetAccount = function(){
				if(scope.password.length > 0) {
					$http({
						method: "PUT",
						url: "/osmo/db/users",
						data: {
							userId : scope.userId,
							password: scope.password
						}
					}).then(function(response){
						console.log(response);
						if(response.data == "success"){
							$window.location.href = '/dashboard'
						}
					}, function(err){
						console.log("Something went wrong :" + err);
					});
				} else {
					console.log("Please create a password!");
					return;
				};
				
			};
		}
	}
})
.directive('navBar', function($http, $location, $timeout, $rootScope){
	return {
		restrict: 'A',
		templateUrl: './templates/nav-bar.html',
		link: function(scope, element, attrs) {
			var params = $location.search();
			scope.currentPage = 'main';
			
			scope.userVideoData;
			scope.userVideoUrl;
			/*
			 *	Intialization function that is run after receiving current user info
			 *	@params {obj} response : response from server
			 */
			scope.userInit = function(response){

				scope.loggedIn = true;
				$rootScope.userLoggedIn = response.data.user;
				if(!$rootScope.userLoggedIn.name) {
					$rootScope.userLoggedIn.name = '';
				}
				$rootScope.$emit('updateCurrentUser', response.data.user);
				if($rootScope.userLoggedIn.videoUri){
					scope.getVideo($rootScope.userLoggedIn.videoUri, function(data){
						if(data.files && data.files[0]){
							scope.userVideoUrl = data.files[0].link;
							scope.videoPreviewInfo = "Your Video Submission";
						} else {
							console.log('no preview available');
							scope.videoPreviewInfo = "Your video is currently unavailable for viewing.";
						}
					});
				}
				
				
			};
			/*
			 *	Requests video informations from Vimeo, then sends data to callback
			 *	After getting the video, it saves the user's video info to scope
			 *	@param {string} videoUri saved in the form of '/videos/#', need to remove "/videos/"
			 */
			scope.getVideo = function(videoUri, callback){
				
				if(!videoUri){
					console.log("videoUri invalid");

				} else {
					videoUri = videoUri.split("/videos/").join('');
					$http({
						method: 'GET',
						url: "/video/"+videoUri
					}).then(function(response){
						
						
						callback(response.data);
					}, function(err){
						console.log(err);
					});
				}
				
			};
			/*
			 *	Grab current user data and load video information from vimeo
			 */ 
			scope.getCurrentUser = function(){
				console.log("getting current user...");
				$http({
					method: 'GET',
					url: "/currentUser"
				}).then(function(response){
					console.log(response);
					if(response.data.msg == "Logged In"){
						$timeout(function(){
							console.log('user logged in');
							scope.userInit(response);
							
						});
						if(params.n){
							scope.navigate(params.n);

						}
					} else {
						// not logged in
						if(params.n && params.n != "dashboard"){
							scope.currentPage = params.n;

						} else {
							scope.navigate("main");
						}
					}
				}, function(err){
					console.log(err);
				});
			};

			/*
			 *	Set the current navigation page
			 *	@param {string} selection : selected page to navigate to
			 */
			scope.navigate =  function(selection){
				scope.currentPage = selection;
				$location.path("/").search('n', selection);
				
				
			};

			/*
			 *	Log user out of current session
			 */
			scope.logout = function(){
				$http({
					method: 'GET',
					url: "/logout"
				}).then(function(response){
					scope.loggedIn = false;
					scope.navigate("main");

				}, function(err){
					console.log(err);
				});
			};
			/*
			 *	Initialize and information
			 */
			if(params.videoId && params.n == "dashboard" && params.userId) {
				// User recently submitted video, save videoId into database
				$http({
					method: "POST",
					url: "/video",
					data: {
						videoId: params.videoId,
						userId : params.userId
					}
				}).then(function(response){
					console.log(response);
					$timeout(function(){
						scope.getCurrentUser();
					});
					
				}, function(err){
					console.log(err);
				});
				$location.url($location.path());
				scope.navigate('dashboard');
			} else {
				$timeout(function(){
					scope.getCurrentUser();
				});
				
			}


		}
	}
})
.directive('upload', function ($sce, $timeout){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){

			scope.checkFile = function(element){
				scope.$apply(function(){

					scope.videoFileSelected = element.files[0];
					// var reader = new FileReader();
					// reader.onload = function(e) {
					//   // handle onload
					// };
					// reader.readAsDataURL(photofile);
				});
			};

			scope.submit = function() {
		    if(!scope.uploadLink && !scope.file)
		      return;
		    scope.$emit('toggleLoader', true);
			  
		  };

		  var socket = io.connect();
		  socket.emit('getUploadForm');
		  socket.on('uploadFormCallback', function(data){
		    $timeout(function(){

		    	scope.uploadLink = $sce.trustAsResourceUrl(data.response.upload_link);

		    });
		    
		  });
		}
	}
})
.directive('dashboard', ['$http', 'Upload', '$timeout', '$rootScope', function($http, Upload, $timeout, $rootScope){
	return {
		restrict: 'A',
		templateUrl: "./templates/dashboard.html",
		link: function(scope, element, attrs) {
			var cacheReminder = element[0].getElementsByClassName('upload-reminder')[0];
			var deregisterRootscope = [];
			scope.showSubmission = false;
			scope.requireHandoff = false;
			scope.showVideoSubmission = false;
			scope.confirmOsmo = null;
			scope.releaseNinja = false;
			scope.showCountdown = false;
			scope.showTurnInfo = false;
			scope.editName = false;
			/*
			 *	Method that runs after you upload a photo
			 *	For more information about parameters, check out the angular-file-upload API
			 */
			scope.selfieSelected = function($files, $file, $newFiles, $duplicateFiles, $invalidFiles, $event){
				console.log(scope.selfiePreview);
				if(scope.selfiePreview){
					scope.showSubmission = true;
				} else {
					scope.showSubmission = false;
				}
				
			};
			var doubleCheckConfirmation = false;
			/*
			 *	Confirms that a user has given the OSMO or recieved the OSMO, triggers "times start" for new user
			 */
			scope.confirmOsmoHandoff = function() {
				$http({
					method: "POST",
					url: '/osmo/db/confirmHandoff',
					data: scope.confirmOsmo
				}).then(function(response){
					console.log(response);
					scope.confirmOsmo = false;
					scope.showCountdown = false;
					scope.$emit("showNetworkResponse", "Handoff Confirmed");
					scope.getCurrentUser();
				}, function(err){
					scope.$emit("showNetworkResponse", "Network Error, try again", error);
				});
			
				
			};

			/*
			 * Confirm Name Change and update server
			 */
			scope.confirmNameChange = function() {
				if($rootScope.userLoggedIn.name == "") {
					alert("Please enter a name!");
					return;
				}
				$http({
					method: "PUT",
					url: "/osmo/db/users/name",
					data: {
						name : $rootScope.userLoggedIn.name
					}
				}).then(function(response){
					console.log(response);
					if(response.data == "success"){
						scope.editName = false;
					}
				}, function(err){
					console.log("Something went wrong :" + err);
				});
			};

			/*
			 *	Sends the uploaded profile picture to the server
			 */
			scope.uploadSelfie = function(){
				scope.$emit('toggleLoader', true);
				Upload.upload({
				  url: '/uploads/'+$rootScope.userLoggedIn.userId+'/selfie',
				  method: 'POST',
				  data: {
				  	userId : $rootScope.userLoggedIn.userId,
				  },
				  file: scope.selfiePreview
				}).then(function (resp) {
					scope.showSubmission = false;
          console.log('Success. Response: ', resp.data);
          $rootScope.userLoggedIn.selfieLocation = resp.data.fileLocation;
					TweenMax.to(cacheReminder, 0.4, {autoAlpha: 0, padding: 0, height: 0, ease: Power2.easeOut});
					scope.$emit('toggleLoader', false);
          scope.$emit('showNetworkResponse', "Upload Success");
          
        }, function (resp) {
          console.log('Error status: ', resp);
          scope.$emit('showNetworkResponse', "Network Error, please try again later", true);
          
        }, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ', evt.config.data);
        });
			};
			/*
			 *	Select a candidate to take the OSMO
			 *	@params {string} userId : the user to hand off the OSMO to
			 */
			scope.selectCandidate = function(userId) {
				console.log(userId);
				scope.selectedCandidate = userId;
			}
			/*
			 *	Sends an email to the selected candidate as the informing they are the next OSMO weilder
			 */
			scope.confirmNextUser = function(){
				if(scope.selectedCandidate){
					$http({
						method: "POST",
						url: '/osmo/db/refer',
						data: {
							recipientId: scope.selectedCandidate
						}
					}).then(function(response){
						console.log(response);
						scope.requireHandoff = false;
						scope.confirmOsmo = {sender: $rootScope.userLoggedIn.userId, recipient: scope.selectedCandidate};
						scope.osmoHandoffMessage = "I have handed off the OSMO device to " + scope.selectedCandidate;
						scope.$emit('showNetworkResponse', scope.selectedCandidate + " has been selected as the next OSMO Candidate");

					}, function(err){
						console.log(err);
						console.log('could not refer user');
						scope.$emit('showNetworkResponse', "Could not refer user, try again.", true);
					});
				} else {
					console.log('no user selected');
				}
			};
			var startClock = function(user){
				
				console.log(user.timeStart);
				// var endDate = moment(user.timeStart).add(2, 'days');
				var totalTime = moment.duration(48, "hours");
				(function animloop() {
				  requestAnimFrame(animloop);
				  // scope.$apply(function(){

				  $timeout(function(){
						var elapsedTime = moment().diff(moment(user.timeStart)),
								durationElapsed = moment.duration(elapsedTime),
								timeLeft = moment.duration(totalTime).subtract(durationElapsed);
						scope.hoursLeft = Math.floor(timeLeft.asHours());
				  	scope.minutesLeft = timeLeft.minutes();
				  	scope.secondsLeft = timeLeft.seconds();
				  	
				  	if(timeLeft.asSeconds() < -500 && !scope.releaseNinja){
							// times up!
							scope.releaseNinja = true;
						} else if(timeLeft.asSeconds() > 0 && scope.releaseNinja){
							scope.releaseNinja = false;
						}

				  	// console.log(scope.timeLeft);
				  });
				  	
				  // });
				})();
				
			};

			$timeout(function(){
				scope.getCurrentUser();
			});
			deregisterRootscope.push(
				$rootScope.$on('updateCurrentUser',function(e, user){
					console.log("watch fired!");
					if(user){
						console.log("Refreshed user object");
						if(user.hasOSMO) {
							if(!user.videoUri) {
								scope.showVideoSubmission = true;
							}
							console.log("showing countdown!");
							scope.showCountdown = true;
							startClock(user);
							if(user.handoffTo){
								// user has the osmo and needs to confirm handing off to other user
								scope.confirmOsmo = {sender: user.userId, recipient: user.handoffTo};
								scope.osmoHandoffMessage = "I have handed off the OSMO device to " + user.handoffTo;
							}
							// scope.timeLeft = Math.abs(new Date() - user.timeStart)
						} else {
							if(user.referer && !user.uploadComplete) {
								scope.confirmOsmo = {sender: user.referer, recipient: user.userId};
								scope.osmoHandoffMessage = "I have received the OSMO";
							}
						}
						if(!user.referer && !user.videoUri && !user.hasOSMO) {
							scope.showTurnInfo = true;
						} else {
							scope.showTurnInfo = false;
						}
						if(!user.selfieLocation) {
							TweenMax.to(cacheReminder, 0.4, {autoAlpha: 1, padding: 20, height: 'initial'});
						}

						if(user.uploadComplete && !user.handoffTo){
							// user has uploaded but has not handed off to anyone
							$http({
								method: "GET",
								url: "/osmo/db/users/hasnotupload"
							}).then(function(response){
								var users = response.data.users;
								scope.requireHandoff = true;
								scope.handoffCandidates = users;
							}, function(err){
								console.log('could not get users who have not uploaded');
							});
						}
					} else {
						console.log("Have not gotten user object yet...", user);
					}
					
				})
			);
			scope.$on("$destroy", function(){
				for(var i = 0, length = deregisterRootscope.length; i < length; i ++){
					deregisterRootscope[i]();
				}
			});
		}

	}
}])
.directive('networkResponse', function($timeout){
	return {
		restrict: 'A',
		template: '<div class="text">{{networkResponse}}</div>',
		link: function(scope, element, attrs) {
			scope.networkError = false;
			var cacheText = element[0].getElementsByClassName('text')[0];
			var tween = new TimelineMax({paused:true});
			tween.set(element, {transformOrigin:'0% 0%'})
			.to(element, 0.4, {scaleY: 1, ease: Power2.easeOut})
			.to(cacheText, 0.2, {autoAlpha: 1, ease:Power2.easeOut});
			scope.$on("showNetworkResponse", function(e, message, error){
				
				if(error) {
					scope.networkError = true;
				} else {
					scope.networkError = false;
				}
				scope.networkResponse = message;
				tween.play();
				$timeout(function(){
        	tween.reverse();
        }, 3000);

			});
		}
	}
})
.directive('guidelines', function(){
	return {
		restrict: 'A',
		templateUrl: './templates/guidelines.html'
	}
})
.directive('loader', function(){
	return {
		restrict: 'A',
		templateUrl: './templates/loader.html',
		link: function(scope, element, attrs){
			var loaderSvg = document.getElementById('draw');
			var tween = new TimelineMax({paused: true, repeat: -1});


			tween.set(loaderSvg, {strokeDasharray:"100% 200%", strokeDashoffset: "0%"})// enter top
			.to(loaderSvg, 2, {strokeDashoffset:"300%", ease: Power0.easeNone});
			tween.play();
			scope.$on('toggleLoader', function(e,show){
				if(show) {
					TweenLite.to(element, 0.4, {autoAlpha: 1});
				} else {
					TweenLite.to(element, 0.4, {autoAlpha: 0});

				}
			});
		}
	}
})
.directive('submitWithEnter', function(){
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			element.on('keyup', function(e){
				scope.$apply(function(){
					if(e.keyCode == 13) {
						scope[attrs.submitWithEnter]();
					}
				});
			});
		}
	}
})
.directive('allUsersView', function($http, $rootScope, $timeout){
	return {
		restrict: "A",
		templateUrl: './templates/all-users.html',
		link: function(scope, element, attrs) {
			scope.selectedUser = null;
			scope.currentVideo = null;
			// scope.ballotsLeft = null;
			scope.voteMessage = "Cast Vote";
			scope.currentAward = {};
			scope.awards = ["Best of Show","Most Creative", "Best Editing", "Best Soundtrack", "Funniest Video"];
			var deregisterRootscope = [];
			/**
			 * Change the current display video
			 */
			function changeCurrentVideo() {
				var videoUri = scope.selectedUser.videoUri;
				scope.currentVideo = null;
				if(videoUri){
					scope.getVideo(videoUri, function(data){
						if(data.files[0]){
							$timeout(function(){
								scope.currentVideo = data.files[0].link;
							});
							
						} else {
							console.log('no preview available');
						}
					});
				}
			};
			function updateVotes(userId, awardIndex, action) {
				var update = function(){
					$http({
						method: "PUT",
						url: "/osmo/db/users/votes",
						data: {
							votes : $rootScope.userLoggedIn.votes
						}
					}).then(function(response){
						console.log(response);
						if(response.data == "success"){
							// changeVoteMessage();
							// updateBallotMessage();
							scope.$broadcast("updateMyVotes");
							console.log('success');
						}

					}, function(err){
						scope.logout();
						console.log("Something went wrong :" + err);
					});
				};

				var userVotes = $rootScope.userLoggedIn.votes;
				if(awardIndex == undefined || awardIndex == null) return;

				while(userVotes.length < scope.awards.length) {
					userVotes.push(undefined);
				}

				switch(action) {
					case "add":
						userVotes[awardIndex] = userId;
						break;
					case "remove":
						userVotes[awardIndex] = undefined;
						break;
					default:
						return;
				};
				update();
					
			};
			/**
			 * Updates the text that describes how many votes you have left
			 */
			// function updateBallotMessage() {
			// 	var numVotes = $rootScope.userLoggedIn.votes.length;
			// 	if(numVotes < 3){
			// 		scope.ballotsLeft = "You have " + (3 - numVotes) + " votes left to cast";
			// 	} else {
			// 		scope.ballotsLeft = null;
			// 	}
			// }


			/**
			 * Changes the text that appears in the button
			 */
			// function changeVoteMessage() {
			// 	var userVotes = $rootScope.userLoggedIn.votes;
			// 	// console.log($rootScope.userLoggedIn);
			// 	if(!scope.selectedUser) {
			// 		return;
			// 	}
			// 	if(userVotes.contains(scope.selectedUser.userId)) {
			// 		scope.voteMessage = "Remove from Votes";
			// 	} else {
			// 		scope.voteMessage = "Cast Vote";					
			// 	}
			// };
			
			
			
			/**
			 * Grabs all known users on database
			 */
			function getAllUsers(){
				$http({
					method: "GET",
					url: "/osmo/db/users/all"
				}).then(function(response){
					$rootScope.$emit('allUsersRetrieved');
					$rootScope.allUsers = response.data.sort(function(a, b){
						var aName = a.name ? a.name : a.userId;
						var bName = b.name ? b.name : b.userId;
						if (aName > bName) {
					    return 1;
					  }
					  if (aName < bName) {
					    return -1;
					  }
					  // a must be equal to b
					  return 0;
					});
					
				}, function(err){
					console.log('could not get all users');
				});
			}

			/*
			 * Pins the user and sets the user's video to the osmo viewport
			 */
			scope.focusUser = function(user){
				scope.selectedUser = user;
				changeCurrentVideo();
				// changeVoteMessage();

			}


			scope.voteAction = function(){
				updateVotes(scope.selectedUser.userId, scope.currentAward.index, "add");
				// if(scope.voteMessage === "Remove from Votes") {
				// 	updateVotes(scope.selectedUser.userId, "remove");
				// } else if(scope.voteMessage === "Add to Votes"){
				// 	updateVotes(scope.selectedUser.userId, "add");
				// }
			};
			scope.$on("removeVote", function(e, awardIndex){
				updateVotes(null, awardIndex, "remove");
			});
			scope.$on("$destroy", function(){
				for(var i = 0, length = deregisterRootscope.length; i < length; i ++){
					deregisterRootscope[i]();
				}
			});


			/**
			 * INITIALIZATION
			 */
			if(!$rootScope.allUsers) {
				getAllUsers();
			}

			// if($rootScope.userLoggedIn) {
			// 	// updateBallotMessage();
			// } else {
			if($rootScope.userLoggedIn){
				scope.userVotes = $rootScope.userLoggedIn.votes;
			} else {
				deregisterRootscope.push(
					$rootScope.$on('updateCurrentUser', function(e, userLoggedIn){
						scope.userVotes = $rootScope.userLoggedIn.votes;
					})
				);
			}
			
			// }

			
		}
	}
})
.directive('userListItem', function(){
	return {
		restrict: 'A',
		templateUrl: "./templates/user-list-item.html",
		link: function(scope, element, attrs){
			
		}
	}
})
.directive('votedUser', function($rootScope, $timeout){
	return {
		restrict: 'A',
		templateUrl: "./templates/voted-user.html",
		link: function(scope, element, attrs) {
			var deregisterRootscope = [];
			var userId;
			scope.userInfo;
			function getUserInfo() {
				if(!userId) return;

				for(var i = 0, length = $rootScope.allUsers.length; i < length; i ++){
					if($rootScope.allUsers[i].userId === userId){
						// console.log($rootScope.allUsers[i]);
						scope.userInfo = $rootScope.allUsers[i];
						return;
					}
				}
			};
			function updateMyVotes() {
				scope.userInfo = null;
				userId = scope.userVotes[scope.$index];
				getUserInfo();
			};
			scope.removeVote = function(){
				scope.$emit("removeVote", scope.$index);
			};

			scope.$on("$destroy", function(){
				for(var i = 0, length = deregisterRootscope.length; i < length; i ++){
					deregisterRootscope[i]();
				}
			});

			if($rootScope.allUsers) {
				getUserInfo();
			} else {
				deregisterRootscope.push(
					$rootScope.$on('allUsersRetrieved', function(){
						$timeout(function(){
							getUserInfo();

						});
					})
				);
			}
			scope.$watch(function(){
				return scope.userVotes;
			}, function(){
				updateMyVotes();
				// console.log(userId);
			}, false);

			scope.$on("updateMyVotes", function(){
				updateMyVotes();
			});
			// if(!$rootScope.userLoggedIn) {
			// 	deregisterRootscope.push(
			// 		$rootScope.$on('updateCurrentUser', function(e, userLoggedIn){
			// 			scope.userVotes = $rootScope.userLoggedIn.votes;
			// 		})
			// 	);
			// } else {
			// 	scope.userVotes = $rootScope.userLoggedIn.votes;
			// }
			
		} 
	}
});
