function copyToClipBoard(text) {
  if (window.clipboardData) { // Internet Explorer
    window.clipboardData.setData("Text", text);
  } else {
    unsafeWindow.netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    const clipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
    clipboardHelper.copyString(text);
  }
}

(function () {
  'use strict';

  angular
    .module('app')
    .controller('LogController', LogController);

  LogController.$inject = [
    '$scope',
    '$http',
    'logService'
  ];

  function LogController($scope, $http, logService) {

    var columnDefs = [
      {
        headerName: '',
        field: 'copy',
        width: 60,
        suppressSizeToFit: true,
        cellRenderer: function (params) {
          var html = JSON.stringify(params.data);
          html = html.replace(/'/g, "*");
          html = html.replace(/"/g, "*");
          html = html.replace(/\\/g, "*");
          return '<button onclick=\'window.prompt(\"Copy\",\"' + html + '\")\';>copy</button>';
        }
      },
      { headerName: "Time", field: "time", width: 70, suppressSizeToFit: true },
      { headerName: "Type", field: "type", width: 70, suppressSizeToFit: true },
      { headerName: "Category", field: "cat", width: 70, suppressSizeToFit: true },
      { headerName: "Data", field: "data" }
    ];

    var rowData = [];

    $scope.files = [];
    $scope.selectedFile = "";
    $scope.isLoading = false;
    $scope.gridOptions = {
      enableFilter: true,
      columnDefs: columnDefs,
      enableColResize: true,
      rowSelection: 'multiple',
      getRowStyle: function (params) {
        if (params.data.type === "error") {
          return {
            'background-color': '#FFBABA',
            'color': '#D8000C'
          }
        } else if (params.data.type === "warn") {
          return {
            'background-color': '#FEEFB3',
            'color': '#9F6000'
          }
        } else if (params.data.type === "info") {
          return {
            'background-color': '#BDE5F8',
            'color': '#00529B'
          }
        }
        return null;
      }
    };

    _activate();
    $scope.refreshList = function () {

      logService.list().then(function (files) {
        $scope.files = angular.fromJson(files);
        $scope.selectedFile = files[0];
        $scope.reloadRows();
      });
    }

    $scope.reloadRows = function () {
      logService.file($scope.selectedFile).then(function (rows) {
        $scope.gridOptions.api.setRowData(rows);
        $scope.gridOptions.api.sizeColumnsToFit();
        $scope.isLoading = false;
      });

    }
    
    $scope.refreshList();
    // BODY //
    function _activate() {

    }
  }
})();