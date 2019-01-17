(function() {
  'use strict';

  angular
    .module('app')
    .directive('b3KeyTable', keytable)
    .controller('KeyTableController', KeyTableController);

  keytable.$inject = ['$parse'];
  function keytable($parse) {
    var directive = {
      scope            : {
                         // _onChange: '&',
                          nodeId: '=',
                          properties:'=',
                          heading:'='
                        },
      restrict         : 'EA',
      replace          : false,
      bindToController : true,
      controller       : 'KeyTableController',
      controllerAs     : 'keytable',
      templateUrl      : 'directives/keytable.html',
      link: link
    };
    return directive;

    function link(scope, element, attrs) {
      // get the value of the `ng-model` attribute
      scope.keytable.heading = attrs.heading;
      
      //scope.keytable._onChange = $parse(attrs.ngChange);
      //scope.keytable.nodeId = $parse(attrs.nodeId);
      //var variable = $parse(attrs.ngModel)(scope);
      //scope.keytable.nodeProperties = attrs.ngModel;
      
    }
  }

  KeyTableController.$inject = ['$scope'];
  function KeyTableController($scope) {
    // HEAD //
    var vm = this;
    vm._onChange = null;
    vm.model  = $scope.keytable.model || $scope.model || null;
    vm.rows   = [];
    vm.add    = add;
    vm.remove = remove;
    vm.change = change;
    vm.reset  = reset;
    vm.options =  {
        mode: 'view',
        search: false
      };
    _activate();
    
    $scope.$watch( 'vm.properties',
                    function(newval,oldval) {
                      $scope.keytable.propertiesJson = angular.toJson(vm.properties);  
      },true);
    // BODY //
    function _activate() {
      if (vm.model) {
        for (var key in vm.model) {
          add(key, vm.model[key], false);
        }
      } else {
        vm.model = {};
      }
    }

    function reset(model) {
      vm.rows = [];
      vm.model = model;
      _activate();
    }

    function add(key, value, fixed) {
      vm.rows.push({key:key, value:value, fixed:fixed===true});
    }

    function remove(i) {
      vm.rows.splice(i, 1);
    }

    function jsonEditor() {
     // $state.go('
    }

    function change() {
      for (var key in vm.model){
        if (vm.model.hasOwnProperty(key)){
          delete vm.model[key];
        }
      }
      for (var i=0; i<vm.rows.length; i++) {
        var r = vm.rows[i];
        if (! r.key) continue;

        var value = r.value;
        if (!isNaN(value) && value !== '') {
          value = parseFloat(value);
        }

        vm.model[r.key] = value;
        
        if (vm._onChange) {
          vm._onChange($scope);
        }
      }
    }
  }

})();