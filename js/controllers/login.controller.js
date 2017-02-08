(function () {
    'use strict';

    angular
        .module('estimate')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$rootScope', '$scope', '$cookies', '$location', 'toastr', 'msgService'];

    function LoginController ($rootScope, $scope, $cookies, $location, toastr, msgService) {
        $rootScope.user = null;
        $scope.title = "Estimation";
        msgService.unsubscribe();

        var states = {
            "SELECT_MODE": "SELECT_MODE",
            "CREATE_ROOM": "CREATE_ROOM",
            "JOIN_ROOM": "JOIN_ROOM",
            "LOADING": "LOADING",
            "ROOMS_FOUND": "ROOMS_FOUND",
            "ROOMS_NOT_FOUND": "ROOMS_NOT_FOUND"
        }

        $scope.changeMainState = changeMainState;
        $scope.changeJoinState = changeJoinState;
        $scope.createRoom = createRoom;
        $scope.joinRoom = joinRoom;
        $scope.state = {
            main: states.SELECT_MODE,
            join: states.LOADING
        }

        ///////////////////////////////////////////////////////////////////////////
        function changeMainState(newState) {
            $scope.state.main = newState;

            switch(newState) {
                case states.SELECT_MODE: 
                    $scope.state.join = states.LOADING;
                    $scope.title = "Estimation";
                    $scope.roomName = "";
                    $scope.userName = "";
                    $scope.rooms = [];
                    break;
                
                case states.CREATE_ROOM:
                    $scope.title = "Create room";
                    $scope.roomName = $cookies.get("roomname");
                    getRooms();
                    break;
                
                case states.JOIN_ROOM:
                    $scope.title = "Join room";
                    $scope.userName = $cookies.get("username");
                    getRooms();
                    break;
            }
        }

        function changeJoinState(newState) {
            $scope.state.join = newState;

            switch(newState) {
                case states.LOADING:
                    $scope.rooms = [];
                    getRooms();
                    break;

                case states.ROOMS_NOT_FOUND:
                    break;
                
                case states.ROOMS_FOUND:
                    break;
            }
        }

        function getRooms() {
            // TODO remove this somehow
            msgService.init({ room: "_BLANK" });
            msgService.hereNow(function(status, data) {
                $scope.rooms = Object.keys(data.channels).filter(function(roomName) {
                    return roomName !== "_BLANK";
                });

                if ($scope.rooms.length) {
                    changeJoinState(states.ROOMS_FOUND);
                } else {
                    changeJoinState(states.ROOMS_NOT_FOUND);
                }

                $rootScope.$$phase || $rootScope.$apply();
            });
        }

        function createRoom(roomName) {
            roomName = roomName.trim();

            if (roomName) {
                if ($scope.rooms.includes(roomName)) {
                    toastr.error("A room with this name already exists.", "Error");
                    return;
                }

                var user = { room: roomName };
                $rootScope.user = user;
                msgService.init(user);

                $cookies.put("roomname", roomName);
                $location.path("/results");
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
