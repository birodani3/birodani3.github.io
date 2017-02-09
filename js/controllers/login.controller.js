(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$rootScope', '$scope', '$cookies', '$location', 'toastr', 'msgService'];

    function LoginController ($rootScope, $scope, $cookies, $location, toastr, msgService) {
        $rootScope.user = null;
        $scope.title = "Estimation";

        $scope.states = {
            "SELECT_MODE": "SELECT_MODE",
            "CREATE_ROOM": "CREATE_ROOM",
            "JOIN_ROOM": "JOIN_ROOM",
            "LOADING": "LOADING",
            "ROOMS_FOUND": "ROOMS_FOUND",
            "ROOMS_NOT_FOUND": "ROOMS_NOT_FOUND"
        };

        $scope.changeMainState = changeMainState;
        $scope.changeJoinState = changeJoinState;
        $scope.createRoom = createRoom;
        $scope.joinRoom = joinRoom;
        $scope.state = {
            main: $scope.states.SELECT_MODE,
            join: $scope.states.LOADING
        };

        ///////////////////////////////////////////////////////////////////////////

        msgService.unsubscribe();

        function changeMainState(newState) {
            $scope.state.main = newState;

            switch(newState) {
                case $scope.states.SELECT_MODE:
                    $scope.state.join = $scope.states.LOADING;
                    $scope.title = "Estimation";
                    $scope.roomName = "";
                    $scope.userName = "";
                    $scope.rooms = [];
                    break;
                
                case $scope.states.CREATE_ROOM:
                    $scope.title = "Create room";
                    $scope.roomName = $cookies.get("roomname");
                    break;
                
                case $scope.states.JOIN_ROOM:
                    $scope.title = "Join room";
                    $scope.userName = $cookies.get("username");
                    getRooms();
                    break;
            }
        }

        function changeJoinState(newState) {
            $scope.state.join = newState;

            switch(newState) {
                case $scope.states.LOADING:
                    $scope.rooms = [];
                    getRooms();
                    break;

                case $scope.states.ROOMS_NOT_FOUND:
                    break;
                
                case $scope.states.ROOMS_FOUND:
                    break;
            }
        }

        function getRooms(callback) {
            // TODO remove this somehow
            msgService.init({ room: "_BLANK" });
            msgService.hereNow(function(status, data) {
                $scope.rooms = Object.keys(data.channels).filter(function(roomName) {
                    return roomName !== "_BLANK";
                });

                if ($scope.rooms.length) {
                    changeJoinState($scope.states.ROOMS_FOUND);
                } else {
                    changeJoinState($scope.states.ROOMS_NOT_FOUND);
                }

                $rootScope.$$phase || $rootScope.$apply();

                callback && callback();
            });
        }

        function createRoom(roomName) {
            roomName = roomName.trim();

            if (roomName) {
                toastr.info("Checking room availability...", "Info");

                getRooms(function() {
                    if ($scope.rooms.includes(roomName)) {
                        toastr.error("Room '" + roomName + "' already exists.", "Error");
                        return;
                    }

                    var user = { room: roomName };
                    $rootScope.user = user;
                    msgService.init(user);

                    $cookies.put("roomname", roomName);
                    $location.path("/results");
                    toastr.success("Room '" + roomName + "' created", "Success");
                });
            } else {
                toastr.error("Please add a name to your room.", "Error");
            }
        }

        function joinRoom(userName, roomName) {
            userName = userName.trim();
            roomName = roomName.trim();

            if (userName && roomName) {
                var user = { name: userName, room: roomName};
                $rootScope.user = user;

                msgService.init(user);
                $cookies.put("roomname", roomName);
                $cookies.put("username", userName);
                $location.path("/estimate");
            } else {
                toastr.error("Please add a username.", "Error");
            }
        }
    }

}());
