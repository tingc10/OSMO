angular.module('OsmoApp.directives', [])
.directive('mosaic', function($timeout, $http){
	return {
		retrict: 'A',
		templateUrl: './templates/mosaic.html',
		link: function(scope, element, attrs) {
			scope.images = [];
			scope.undisplayedMedia = [];
			scope.unloadedImages = 40;
			scope.loremFlickr = {
				link:'//loremflickr.com/320/240/office,people,collaboration', 
				user: null
			};

			var numAwaitingResponse = 0;
			var stampElements = element[0].getElementsByClassName('stamp');
			var osmoImage = element[0].getElementsByClassName('osmo-image')[0];
			var osmoHeight;
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
					if(scope.unloadedImages){
						scope.unloadedImages--;
						if(lengthUndisplayed > 0) {
							randomIndex = Math.floor(Math.random()*lengthUndisplayed);
							var tmp = scope.undisplayedMedia[randomIndex];
							scope.undisplayedMedia.splice(randomIndex, 1);
							if(!scope.currentVideo){
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
								
						} else {
							loadImageCallback(scope.loremFlickr.link, function(response){
								if(response.msg == "success") {
									scope.images.push({link: response.image.src, user: null});
								} else {
									console.log('image load error...');
								}
								scope.$apply();
								loadHelper();
							});
							
						}
					}
				});
					
			};

			/*
			 *	Using 
			 *	@params {array} users : array of users with media
			 */
			var performInitialFill = function(){
				// randomly set the images of 100 items
				var lengthUndisplayed = scope.undisplayedMedia.length;
				var randomIndex;
				var delay = 0;
				
				loadHelper();
				// for(var i = 0; i < totalLoad; i++){
				// 	if(lengthUndisplayed > 0) {
				// 		$timeout(function(){
				// 			scope.unloadedImages--;
				// 			randomIndex = Math.floor(Math.random()*lengthUndisplayed);
				// 			scope.images.push(scope.undisplayedMedia[randomIndex]);
				// 			scope.undisplayedMedia.splice(randomIndex, 1);
				// 		}, delay);
				// 		lengthUndisplayed--;
							
				// 	} else {

				// 		$timeout(function(){
				// 			scope.unloadedImages--;
				// 			scope.images.push(scope.loremFlickr);
				// 		},delay);
						
				// 	}
				// 	delay += 200;
				// }
				
			};


			/*
			 *	Gets all the possible media that can be displayed
			 */
			var getAllPhotoMedia = function(){
				getAllUsersWithMedia(function(response){
					var users = response.data;
					console.log(users);
					scope.allUsersWithMedia = users;
					for(var i = 0, length = users.length; i < length; i++) {
						var user = users[i];
						scope.undisplayedMedia.push({link:user.selfieLocation, user: user});
						if(user.videoUri) {
							if(!user.vimeoThumbnail) {
								// the user has a video uploaded but vimeoThumbnail has not been saved
								(function(index) {
									return function(){
										numAwaitingResponse++;
										cacheUserVimeoThumbnail(user, function(response){
											if(response.msg == "success"){
												
												scope.undisplayedMedia.push({link:response.link, user: user});
											} else {
												console.log(response);
											}
											numAwaitingResponse--;
											if(numAwaitingResponse == 0){
												performInitialFill();
											}
											// if this callback is the final response to the last user,
											//	do a random selection
											
										});
									};
								})(i);
								
							} else {
								scope.undisplayedMedia.push({link: user.vimeoThumbnail, user: user});

							}
						}
					}
					if(numAwaitingResponse == 0){
						performInitialFill();
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

					if(data.pictures.sizes.length > 0){
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
					scope.getVideo(videoUri, function(data){
						if(data.files[0]){
							$timeout(function(){
								scope.currentVideo = data.files[0].link;
							});
							
							
						} else {
							console.log('no preview available');
						}
					});
				});
			});
			/*
			 *	Initializer
			 */
			$timeout(getAllPhotoMedia);
			
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
		}
	}
})
.directive('packeryItem', function($timeout){
	return {
		restrict: 'A',
		templateUrl: './templates/video-wrapper.html',
		link: function(scope, element, attrs){
			var dragging = false,
					mousedown = false,
					imageLoaders = element[0].getElementsByClassName('image-loader'),
					topLayer = "front",
					pauseGetNew = false;
			TweenLite.set(imageLoaders[1], {zIndex: 1});
			scope.linkOne = scope.image.link;

			/*
			 *	Loads image via callback function then fades out layer on top
			 */
			var setNewLink = function(imageInfo, callback){
				
				$timeout(function(){
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
					if(scope.image.user && scope.image.user.videoUri){
						scope.$emit('changeCurrentVideo', scope.image.user.videoUri);

					}
					
					
					
					
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
					if(!pauseGetNew){
						var currentImageInfo = scope.image,
								length = scope.undisplayedMedia.length;
						// check if there are undisplayed items that can be swapped out
						if(length > 0){
							var randomIndex = Math.floor(Math.random()*length);
							var imageInfo = scope.undisplayedMedia[randomIndex];
							setNewLink(imageInfo, getNewImage);
							scope.undisplayedMedia.splice(randomIndex, 1);
							
						} else {
							setNewLink(scope.loremFlickr, getNewImage);
						}
						if(currentImageInfo.user){
							// this is a real item (as opposed to filler image)
							// return this info back to undisplayedMedia
							scope.undisplayedMedia.push(currentImageInfo);
						}
					}
					
						
					// }
				}, randomDelay);
				
			};
			getNewImage();

		}
	}
})
.directive('loginPanel', function($http, $timeout){
	return {
		restrict: "A",
		templateUrl: './templates/login-panel.html',
		link: function(scope, element, attrs) {
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
						scope.loggedIn = true;
						scope.currentPage = "dashboard";
						scope.currentUser = response.data.user;
						scope.getVideo(scope.currentUser.videoUri, function(data){
							console.log(data);
							scope.userVideoData = data;
							if(data.files[0]){
								scope.userVideoUrl = data.files[0].link;
								
							} else {
								console.log('no preview available');
							}
						});
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
.directive('navBar', function($http, $location, $timeout){
	return {
		restrict: 'A',
		templateUrl: './templates/nav-bar.html',
		link: function(scope, element, attrs) {
			
			var params = $location.search();
			scope.currentPage = 'main';
			scope.loggedIn = false;
			scope.userVideoData;
			scope.userVideoUrl;
			/*
			 *	Requests video informations from Vimeo, then sends data to callback
			 *	After getting the video, it saves the user's video info to scope
			 */
			scope.getVideo = function(videoUri, callback){
				if(!videoUri){
					console.log("videoUri invalid");

				}
				$http({
					method: 'GET',
					url: "/video"+videoUri
				}).then(function(response){
					
					
					callback(response.data);
				}, function(err){
					console.log(err);
				});
			};
			/*
			 *	Grab current user data and load video information from vimeo
			 */ 
			var getCurrentUser = function(){
				$http({
					method: 'GET',
					url: "/currentUser"
				}).then(function(response){
					if(response.data.msg == "Logged In"){
						scope.loggedIn = true;
						scope.currentUser = response.data.user;
						if(scope.currentUser.videoUri){
							scope.getVideo(scope.currentUser.videoUri, function(data){
								if(data.files && data.files[0]){
									scope.userVideoUrl = data.files[0].link;
									
								} else {
									console.log('no preview available');
								}
							});
						}
						
						console.log(response.data.user);
						if(params.navigate){
							scope.currentPage = params.navigate;
						}
					} else {
						// not logged in
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
					scope.currentPage = "main";
				}, function(err){
					console.log(err);
				});
			};
			/*
			 *	Initialize and information
			 */
			if(params.videoId && params.navigate == "dashboard" && params.userId) {
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
					getCurrentUser();
				}, function(err){
					console.log(err);
				});
			} else {
				getCurrentUser();
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
		    console.log("runnning...");
			  
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
.directive('dashboard', ['$http', 'Upload', function($http, Upload){
	return {
		restrict: 'A',
		templateUrl: "./templates/dashboard.html",
		link: function(scope, element, attrs) {
			scope.showSubmission = false;
			scope.requireHandoff = false;
			scope.showVideoSubmission = false;
			scope.selfieSelected = function($files, $file, $newFiles, $duplicateFiles, $invalidFiles, $event){
				console.log(scope.selfiePreview);
				if(scope.selfiePreview){
					scope.showSubmission = true;
				} else {
					scope.showSubmission = false;
				}
				
			};
			scope.uploadSelfie = function(){
				Upload.upload({
				  url: '/uploads/'+scope.currentUser.userId+'/selfie',
				  method: 'POST',
				  data: {
				  	userId : scope.currentUser.userId,
				  },
				  file: scope.selfiePreview
				}).then(function (resp) {
					scope.showSubmission = false;
          console.log('Success. Response: ', resp.data);
          scope.currentUser.selfieLocation = resp.data.fileLocation;
        }, function (resp) {
          console.log('Error status: ', resp);
        }, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ', evt.config.data);
        });;
			};
			scope.confirmNextUser = function(){
				if(scope.selectedCandidate){
					$http({
						method: "POST",
						url: '/osmo/db/refer',
						data: {
							recipient: scope.selectedCandidate
						}
					}).then(function(response){
						console.log(response);
						scope.requireHandoff = false;
					}, function(err){
						console.log('could not refer user');
					})
				} else {
					console.log('no user selected');
				}
			};
			scope.$watch(scope.currentUser,function(newVal, oldVal){
				var user = scope.currentUser;
				if(user){
					if(user.hasOSMO) {
						scope.showSubmission = true;
					}
					if(user.uploadComplete && !user.handOffTo){
						// user has uploaded but has not handed off to anyoe
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
					console.log("huh... error...");
				}
			});
			
		}

	}
}])
.directive('guidelines', function(){
	return {
		restrict: 'A',
		templateUrl: './templates/guidelines.html'
	}
});
