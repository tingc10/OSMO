/* 
NOTES: Presenter is the second video element because the row/height is calculated via first element of .vid-element class
*/


angular.module('VideoLayouts', [])
.directive('settings', function($timeout){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			var layoutWrapper = function(){
				// TODO: On Complete wrapper function
				scope.$emit('packeryLayout');
			};
			scope.$on('toggleExit', function(e, exit){
				// TODO: Expands sidebar if icon is the exit icon,
				//				collapses if hamburger menu
				if(exit){
					TweenMax.to(element, 0.5, {width: 300, ease: Power2.easeOut, onComplete:layoutWrapper});
				} else {
					TweenMax.to(element, 0.5, {width: 50, ease: Power2.easeOut, onComplete:layoutWrapper});
				}
				
				
			});
		}
	}
})
.directive('toggleExit', function(){
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var exit = false;		// true when current icon is exit icon
			scope.toggleIcon = function(){
				// TODO: On click, toggle exit flag will trigger CSS animation and emit
				//				an event to open sidebar
				exit = !exit;
				if(exit){
					element.addClass('exit');
				} else {
					element.removeClass('exit');
				}
				scope.$emit('toggleExit', exit);
			};
		}
	}
})
.controller('LayoutCtrl', function($scope){
	$scope.pinOrientation = 'full';
	$scope.numUsers = [];
	$scope.getSize = function(containerDims, element){
		// TODO: gets container size and sets the width, height and ratio
		containerDims.width = element[0].offsetWidth;
		containerDims.height = element[0].offsetHeight;
		containerDims.ratio = containerDims.width/containerDims.height;
	};
	
})
.directive("options", function($http, $timeout, $location){
	return {
		restrict: 'A',
		link: function(scope, element, atttrs){
			
			scope.lengthUsers = 0;
			scope.currentMode = [true, false];
			
			var initWith = $location.search().init || 1;		// query string 'init' sets the value to init with
			var pushRandomImage = function(){
				// TODO: pushes a random GIF onto the numUsers array
				scope.lengthUsers++;
				$http.get('http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=smile')
				.then(function(response){
					scope.numUsers.push(response.data.data.image_url);
				}, function(response){
					console.log("error loading gif");
				});
			};
			var initWithNumImages = function(num){
				// TODO: inits the numUsers array with num
				for(var i = 0; i < num;i++){
					pushRandomImage();
				}
			};
			
			scope.$on('toggleExit', function(e, exit){
				// TODO: reveals all the options
				if(exit){
					TweenMax.to(element, 0.5, {right: 0, ease:Power2.easeOut});
				} else {
					TweenMax.to(element, 0.5, {right: '100%', ease:Power2.easeOut});
				}
			});
			scope.editUsers = function(add){
				// TODO: Adds or subtracts the total number of users
				if(add){
					// add a user
					if(scope.lengthUsers+1 <= 12){
						pushRandomImage();
					} else {
						// numUsers cannot be greater than 12
					}
				} else {
					// else subtract
					if(scope.lengthUsers-1 >= 1){
						scope.numUsers.pop();
						scope.lengthUsers--;
					} else {
						// numUsers cannot be less than 1
					}
				}
				scope.$emit('editLayout');
				
			}
			scope.chooseMode = function(index) {
				// TODO: sets the index of mode to index and sets everything else to false
				if(scope.lengthUsers == 1 && index == 2) {
					// if there's only one user, cannot do presenter mode
					return;
				}
				scope.currentMode = [false, false];
				scope.currentMode[index] = true;
				scope.$emit('cachePresenter', true);
				
				
				if(scope.currentMode[0]){
					// first mode is equal view, if enabled, hide pinned elements
					scope.pinOrientation = "full";
				} else if (scope.currentMode[1] || scope.currentMode[2]) {
					// active speaker or shared screen view enabled
					scope.$emit('determineBestOrientation');
				}
				$timeout(function(){
					// TODO: after DOM refreshes with new CSS, cache new dimensions
					scope.$emit('refreshDimensions');
				});
				
			};
			initWithNumImages(9);
		}
	}
})
.directive('layoutContainer', function($timeout, $window){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			var w = angular.element($window);
			var presenter = null;			// caches the presenter
			var promise;
			// cache container dimensions
			var containerDims = {
				width: 0,
				height: 0,
				ratio: 0
			};
			var cachePresenter = function(e, reset){
				// TODO: Caches the DOM of presenter to a private
				//				variable
				// PARAMS: reset is a boolean value that is set to true if
				//					presenter needs to reset to null
				if(reset){
					presenter = null;
				} else {
					presenter = element[0].querySelector('.presenter');

				}
			};
			var packeryLayout = function(){
				// TODO: chooses the most appropriate layout function for
				//				the mode that is selected
				
				if(scope.currentMode[0] || scope.currentMode[1]){
					scope.pckry.layout();
				} else {
					if(!presenter) {
						cachePresenter(null, false);
					}
					scope.pckry.fit(presenter, 0, 0);
				}
				
			};
			
			var setLayoutClass = function(){
				// TODO: looking at the dimensions, ratio, and number of users, set the best layout class
				//				triggered when new elements are added, or after window resize
				// REQUIRE: container dimensions already defined and set to offsetWidth, offsetHeight, and ratio
				
				// remove the class starting with -dim-
				var tmp;
				for (var i=0, l=element[0].classList.length; i<l; ++i) {
					tmp = element[0].classList[i];
					if(/-dim-.*/.test(tmp)) {
						element[0].classList.remove(tmp);
						break;
					}
				}
				
				switch(scope.lengthUsers){
					case 1:
						element[0].classList.add('-dim-1x1');
						break;
					case 2:
						if(containerDims.ratio >= 4/3) {
							element[0].classList.add('-dim-1x2');
						} else {
							element[0].classList.add('-dim-2x1');
						}
						break;
					case 3:
						if(containerDims.ratio >= 16/9) {
							element[0].classList.add('-dim-1x3');
						} else if(containerDims.ratio <= 1) {
							element[0].classList.add('-dim-3x1');
						} else {
							element[0].classList.add('-dim-2x2');
						}
						break;
					case 4:
						if(containerDims.ratio >= 3) {
							element[0].classList.add('-dim-1x4');
						} else if(containerDims.ratio <= 3/4) {
							element[0].classList.add('-dim-4x1');
						} else {
							element[0].classList.add('-dim-2x2');
						}
						break;
					case 5:
						if(containerDims.ratio >= 3) {
							element[0].classList.add('-dim-1x5');
						} else if(containerDims.ratio >= 4/3) {
							element[0].classList.add('-dim-2x3');
						} else if(containerDims.ratio <= 9/16) {
							element[0].classList.add('-dim-5x1');
						} else {
							element[0].classList.add('-dim-3x2');
						}
						break;
					case 6:
						if(containerDims.ratio >= 3) {
							element[0].classList.add('-dim-1x6');
						} else if(containerDims.ratio >= 4/3) {
							element[0].classList.add('-dim-2x3');
						} else if(containerDims.ratio <= 9/16) {
							element[0].classList.add('-dim-6x1');
						} else {
							element[0].classList.add('-dim-3x2');
						}
						break;
					case 7:
						if(containerDims.ratio >= 4) {
							element[0].classList.add('-dim-1x7');
						} else if(containerDims.ratio >= 4/3) {
							element[0].classList.add('-dim-2x4');
						} else if(containerDims.ratio <= 6/16) {
							element[0].classList.add('-dim-7x1');
						} else {
							element[0].classList.add('-dim-4x2');
						}
						break;
					case 8:
						if(containerDims.ratio >= 4) {
							element[0].classList.add('-dim-1x8');
						} else if(containerDims.ratio >= 4/3) {
							element[0].classList.add('-dim-2x4');
						} else if(containerDims.ratio <= 6/16) {
							element[0].classList.add('-dim-8x1');
						} else {
							element[0].classList.add('-dim-4x2');
						}
						break;
					case 9:
						if(containerDims.ratio >= 16/3) {
							element[0].classList.add('-dim-1x9');
						} else if(containerDims.ratio >= 16/8) {
							element[0].classList.add('-dim-2x5');
						} else if(containerDims.ratio <= 5/16) {
							element[0].classList.add('-dim-9x1');
						} else if(containerDims.ratio <= 11/16) {
							element[0].classList.add('-dim-5x2');
						} else {
							element[0].classList.add('-dim-3x3');
						}
						break;
					case 10:
						if(containerDims.ratio >= 16/3) {
							element[0].classList.add('-dim-1x10');
						} else if(containerDims.ratio >= 16/9) {
							element[0].classList.add('-dim-2x5');
						} else if(containerDims.ratio <= 5/16) {
							element[0].classList.add('-dim-1x10');
						} else if(containerDims.ratio <= 10/16) {
							element[0].classList.add('-dim-5x2');
						} else {
							element[0].classList.add('-dim-4x3');
						}
						break;
					case 11:
					case 12:
					default:
						if(containerDims.ratio >= 16/3) {
							if(scope.lengthUsers == 11){
								element[0].classList.add('-dim-1x11');
							} else {
								// with 12 or more
								element[0].classList.add('-dim-1x12');
							}
						} else if(containerDims.ratio >= 16/6) {
							element[0].classList.add('-dim-2x6');
						} else if(containerDims.ratio >= 16/9) {
							element[0].classList.add('-dim-3x4');
						} else if(containerDims.ratio <= 4/16) {
							if(scope.lengthUsers == 11){
								element[0].classList.add('-dim-11x1');
							} else {
								// with 12 or more
								element[0].classList.add('-dim-12x1');
							}
						} else if(containerDims.ratio <= 10/16) {
							element[0].classList.add('-dim-6x2');
						} else {
							element[0].classList.add('-dim-4x3');
						}
						break;
					
				}
				
			};
			var resizeAndLayout = function(){
				// TODO: checks size and layout class
				scope.getSize(containerDims, element);
				setLayoutClass();
				packeryLayout();
			};
			// init
			scope.pckry = new Packery(element[0],{
				columnWidth: '.vid-elements',
				rowHeight: '.vid-elements'
			});
			scope.pckry.on( 'dragItemPositioned', function( draggedItem ) {
				$timeout(function(){
					packeryLayout();
				});
			});
			
			scope.$on('layoutAfterRemoval', function(){
				$timeout(function(){
					
					packeryLayout();
				});
			});
			resizeAndLayout();
			
			// binds to window resize and triggers layout on resize
			w.bind('resize', function(){
				// TODO: calls packery layout on resize
				if(promise){
					// prevents layout from calling too many times
					$timeout.cancel(promise);
				}
				promise = $timeout(function(){
					// add .5s delay to prevent layout from running too often
					if(scope.currentMode[0]){
						// if equal mode, just cache new dimensions, otherwise..
						
						resizeAndLayout();
					} else {
						// not equal mode, need to check wrapper dimension
						// then have wrapper directive resizeAndLayout
						scope.$emit('determineBestOrientation');
						$timeout(function(){
							scope.$emit('refreshDimensions');
						});
						
						
					}
					
				}, 250);
			});
			
			
			scope.$on('editLayout', setLayoutClass);
			scope.$on('resizeAndLayout', resizeAndLayout);
			scope.$on('refreshDimensions', resizeAndLayout);
			scope.$on('packeryLayout', packeryLayout);
			scope.$on('cachePresenter', cachePresenter);
		}
	}
})
.directive('vidElement',function(){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			
			// make element draggable with Draggabilly
			
			scope.pckry.appended(element[0]);
    	var draggie = new Draggabilly( element[0] );
			scope.pckry.bindDraggabillyEvents(draggie);
			scope.$emit('packeryLayout');
//     	scope.$emit('newDraggable', draggie);
			element.on('$destroy', function(){
				scope.pckry.remove(element[0]);
				scope.$emit('layoutAfterRemoval');
				
			});
		}
	}
})
.directive('wrapper', function($timeout){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			var containerDims = {
				width: 0,
				height: 0,
				ratio: 0
			};
			var determineBestOrientation = function(){
				// TODO: checks the wrapper size and determines if pinned
				//				and participants should be aligned by row or column
				if(containerDims.ratio > 16/9){
					scope.pinOrientation = 'row';
					
				} else {
					scope.pinOrientation = 'column';
				}
				/*$timeout(function(){
					// TODO: after CSS has settled, use new layout container size
					//				to resize and layout the participants
					
					scope.$emit('resizeAndLayout');
				});*/
				
			};
			/*scope.$on('windowResize', function(){
				scope.getSize(containerDims, element);
				determineBestOrientation();
			});*/
			scope.$on('refreshDimensions', function(){
				// TODO: cache new dimensions of container
				scope.getSize(containerDims, element);
			});
			scope.$on('determineBestOrientation', determineBestOrientation);
		}
	}
});