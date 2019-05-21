(function () {
    'use strict';

    angular
        .module('app').directive('copyToClipboard', function ($document) {
            return {
                restrict: 'A',
                link: function (scope, elem, attrs) {
                    elem.on('click', function () {
                        if (attrs.copyToClipboard) {
                            var textArea = document.createElement("textarea");
                            textArea.value = attrs.copyToClipboard;
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            document.execCommand("copy");
                            document.body.removeChild(textArea);
                        }
                    });
                }
            };
        })
})();