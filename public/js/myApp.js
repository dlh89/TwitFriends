var app = angular.module("myApp",['ngMaterial', 'ngSanitize'],function($locationProvider){
    $locationProvider.html5Mode(true);
});

// active page is highlighted in navbar
app.controller('navCtrl', function($scope, $location) {
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };
})
