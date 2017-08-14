angular.module('blockappmodule', ['ngStorage','blockappmodule.service'])
.controller('dashboardCtrl', function($scope,UserService,$localStorage,$sessionStorage) {
  $scope.dashboardTest="dashboardTest1";

  $scope.createNewAddress = function() {
      var userDetails={
        email:"test@gmail.com"
      }
      UserService.createNewAddress(userDetails).
        then(function(response) {
            console.log("Response :: " + angular.toJson(response));
            if (response.status == 200) {
              alert("address created Succesfully");
            }
      });
  };
})
.controller('loginCtrl', function($scope,UserService,$localStorage,$sessionStorage,$window) {
  $scope.loginTest="loginTest1";

  $scope.loginUser = function() {
    $scope.loginUserDetails={
        "email": $scope.email,
        "password": $scope.password
    };
    alert("posting data "+angular.toJson($scope.loginUserDetails));
    UserService.userLogin($scope.loginUserDetails).
      then(function(response) {
          console.log(response);
          if (response.status == 200) {
            //alert("reponse 2000 "+response.data.id);
            $scope.loginIdtest=response.data.id;


          }
    });

  };
})


;
