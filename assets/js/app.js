angular.module("app",['ui.bootstrap'])

.config([function(){
	console.log("config running...");
}])

.run([function(){
	console.log("app running...");	
}])

.controller("loginController",["$scope", "$http", function($scope, $http){
	
	$scope.formLogin = {};
	$scope.formSingup = {};
	
	$scope.login = function(){
		$scope.formLogin.msg = null;
		
		if(!$scope.formLogin.username || !$scope.formLogin.password){
			$scope.formLogin.msg = "You must enter password and username";
		}
		else{
			$scope.formLogin.sending = true;
			$http.post("api/singin",{
				username: $scope.formLogin.username,
				password: $scope.formLogin.password
			})
			.then(function(response){
				$scope.formLogin.sending = false;
				if(response.data.bad_user){
					$scope.formLogin.msg = "Username or password incorrect";
					return;
				}
				
				location.href="map";
				
				
			},function(err){
				$scope.formLogin.sending = false;
				console.log(err);
			});
			
		}
	};
	
	$scope.register = function(){
		$scope.formSingup.msg = null;
		if(!$scope.formSingup.username || !$scope.formSingup.password){
			$scope.formSingup.msg = "You must enter a password and username"; 	
		}
		else if($scope.formSingup.password != $scope.formSingup.repassword){
			$scope.formSingup.msg = "Passwords does not match"; 
		}
		else{
			$scope.formSingup.sending = true;
			$http.post("api/singup",{
				username: $scope.formSingup.username,
				password: $scope.formSingup.password
			})
			.then(function(response){
				$scope.formSingup.sending = false;
				if(response.data.taken){
					$scope.formSingup.msg = "Sorry, but this username was already taken by another person. Please try another one!";
					return;
				}
				
				location.href="map";
				
				
			},function(err){
				$scope.formLogin.sending = false;
				console.log(err);
			});
			
		}
	};
}])

.controller("mapController",["$scope", "$http", function($scope, $http){
    $scope.map = {};
    $scope.allPaths = [];
    $scope.currentPath = null;
    $scope.markersOnMap = [];
    $scope.newPath = {};
    
    $scope.loadAllPaths = function(){
    	$http.get("api/path")
	    .then(function(response){
	    	
			$scope.allPaths = response.data.map(function(path){
				return new google.maps.Marker({
				    position: {
				    	lat: path.start_point.lat,
				    	lng: path.start_point.long,
				    },
				    title:path.name,
				    id: path.id
				});
			});
			
			$scope.allPaths.forEach(function(path){
				path.addListener('click',$scope.openPath.bind(path));
			});
			
			$scope.loadMarkers($scope.allPaths);
			
			console.log($scope.allPaths);
			
	    });	
    };
    $scope.loadAllPaths();
    
    var loadPath = function(path_id){
    	$http.get("api/path/"+path_id)
    	.then(function(response){
    		$scope.currentPath = response.data;
    		var markerPoints = response.data.points.map(function(point){
    			return new google.maps.Marker({
				    position: {
				    	lat: point.lat,
				    	lng: point.long,
				    },
				    title:point.name,
				    label:point.order+"",
				    id: point.id
				});
    		});
    		
    		markerPoints.forEach(function(point){
    			point.addListener('click',$scope.focusPoint.bind(point));	
    		});
    		
    		$scope.loadMarkers(markerPoints);
    		$scope.loadSideBar("path");
    	});
    };
    
    $scope.openPath = function(){
    	path_id = this.id;
    	loadPath(path_id);
    };
    
    $scope.removeMarkers = function(){
		
		$scope.markersOnMap.forEach(function(marker){
			marker.setMap(null);
		});
    };
    
    $scope.loadMarkers = function(markers){
    	
    	$scope.removeMarkers();
    	$scope.markersOnMap = markers;
    	markers.forEach(function(marker){
    		marker.setMap($scope.map);
    	});
    };
    
    $scope.createPath = function(){
    	$scope.removeMarkers();
    	$scope.newPath = {};
    	$scope.loadSideBar("builder");
    };
    
    $scope.addPoint = function(){
    	
    	if(!$scope.newPath.points){
    		$scope.newPath.points = [];
    	}
    	$scope.newPath.lastPoint = null;
    	
    	$scope.newPath.mapListener = $scope.map.addListener('click', function(event){
    		
    		$scope.newPath.lastPoint = {};
    		google.maps.event.removeListener($scope.newPath.mapListener);
    		var pointMarker = new google.maps.Marker({
			    position: event.latLng,
			    label: ($scope.newPath.points.length + 1) + "",
			});
			$scope.markersOnMap.push(pointMarker);
			$scope.newPath.lastPoint.marker = pointMarker;
			pointMarker.setMap($scope.map);
			$scope.newPath.mapListener = null;
			$scope.$apply();
    	});	
    };
    
    $scope.includePoint = function(keepGoing){
    	

    	$scope.newPath.points.push({
    		name: $scope.newPath.lastPoint.name,
    		description: $scope.newPath.lastPoint.description,
    		directions_next: $scope.newPath.lastPoint.next,
    		lat: $scope.newPath.lastPoint.marker.position.lat(),
    		long: $scope.newPath.lastPoint.marker.position.lng(),
    		order: $scope.newPath.points.length + 1,
    		is_last: !keepGoing
    	});
    	
    	if(keepGoing){
    		$scope.addPoint();
    	}
    	else{
    		$scope.sendNewPath($scope.newPath);
    	}
    	
    };
    
    $scope.sendNewPath = function(newPath){
    	
    	var payload = {
    		name: newPath.name,
    		description: newPath.description,
    		points: newPath.points
    	};
    	
    	
    	$scope.newPath.lastPoint = null;

    	$http.post("api/path",payload)
    	.then(function(response){
    		console.log(response.data);
    		if(response.data){
    			$scope.newPath.is_saved = true;
    		}
    	},function(err){
    		console.log(err);
    	});
    	
    	
    };
    
    $scope.goCity = function(city){
    	var cities = {
    		nyc: {
    			lat: 40.739063,
    			long: -73.993349
    		},
    		sf: {
    			lat: 37.774929,
    			long: -122.419416
    		},
    		paris: {
    			lat: 48.856614,
    			long: 2.352222
    		},
    		ccs: {
    			lat: 10.480594,
    			long: -66.903606
    		}
    	}
    	
    	$scope.map.setCenter(new google.maps.LatLng(cities[city].lat, cities[city].long));
    }
    
    $scope.logout = function(){
   		$http.post("api/logout",{})
   		.then(function(response){
   			if(response.data.logout){
   				location.href="";
   			}
   		});
    };
    
}])

.directive("sideBar",[function(){
    return {
        restrict: "A",
        link: function(scope,element){
        	
        	$('#myModal').modal('show');
        	
        	scope.sidebar = {
        		state: null,
        		stateTitle: null
        	};
        	
        	scope.loadSideBar = function(state){
        		
        		scope.sidebar.state = state;
        		
        		if(state == "path"){
        			console.log(scope.currentPath);
        			scope.sidebar.stateTitle = scope.currentPath.name;
        		}
        		else if(state == "builder"){
        			scope.sidebar.stateTitle = "Create your Path here";
        		}
        		
				$(element).animate({
					    right: 0 
				}, 800);
        	};
        	
        	scope.centerMap = function(point){
        		scope.map.setCenter(new google.maps.LatLng(point.lat, point.long));
        		$('.bg-focused').removeClass('bg-focused');
				$("#point-"+point.id).addClass('bg-focused');
        	};
        	
        	scope.focusPoint = function(){
        		var point_id = this.id;
				$(element).animate({
					scrollTop: $("#point-"+point_id).offset().top
				}, 400, function(){
					$('.bg-focused').removeClass('bg-focused');
					$("#point-"+point_id).addClass('bg-focused');
				});
    		};
    		
    		scope.closeSidebar = function(){
    			
    			if(scope.sidebar.state == "builder" && scope.newPath.mapListener){
    				google.maps.event.removeListener(scope.newPath.mapListener);
    			}
    			
    			scope.loadAllPaths();
    			$(element).animate({
					right: "-20%" 
				}, 800,
					function(){
						scope.sidebar = {
		        		state: null,
		        		stateTitle: null
		        	};
				});
    		};
        	
        }
    };
}])

.directive("googleMaps",[function(){
    return {
        restrict: "E",
     	replace: true,
        template: "<div id='map'></div>",
        scope: {
        	map: "="
        },
        link: function(scope,element){
 
        	scope.map = new google.maps.Map(document.getElementById('map'), {
		 		center: {lat: 40.739063, lng: -73.993349},
				zoom: 13
			});
			
        }
    };
}]);


