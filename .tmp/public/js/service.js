angular.module('blockappmodule.service', [])
  .factory('UserService', function($http) {
    function UserService() {}

    // UserService.getLoyaltyPointsApproval = function() {
    //   return $http.get(constants.projectName + '/getRedeemProductForApproval?statusId=4', {
    //     headers: {
    //       'Content-Type': 'application/json;charset=UTF-8'
    //     }
    //   }).then(function(response) {
    //
    //     var data = response.data;
    //
    //     return response.data;
    //
    //   });
    // };
    UserService.userLogin = function(userDetails) {
      alert("posting data "+angular.toJson(userDetails));
      return $http.post('http://localhost:1337/session/create', userDetails, {
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(function(response) {
      
        return response;
      });
    };
    UserService.createNewAddress = function(userDetails) {
      return $http.post('http://localhost:1337/user/createNewAddressApi', userDetails, {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        }
      }).then(function(response) {
        //alert(angular.toJson(response));
        return response;
      });
    };
    UserService.sendAmountToAddress = function(userDetails) {
      return $http.post('http://localhost:1337/user/createNewAddressApi', userDetails, {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        }
      }).then(function(response) {
        //alert(angular.toJson(response));
        return response;
      });
    };

    return UserService;
  });
