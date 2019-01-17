/**
 * ng-chatbox - Chat box component for angular
 * @version v1.0.1
 * @link https://github.com/Liksu/ng-chatbox#readme
 * @license MIT
 */
!function () { var a = ".holder {\n  border: 1px dotted navy;\n  height: 400px;\n  width: 240px;\n  background-color: #EEF;\n  font: 12px Verdana;\n  position: relative;\n  overflow-y: auto; }\n\n.scroller {\n  position: absolute;\n  bottom: 0px;\n  width: 100%;\n  overflow-y: auto;\n  max-height: 400px; }\n\n.wrap {\n  position: relative;\n  width: 100%;\n  padding-bottom: 8px; }\n\n.message {\n  text-align: left;\n  padding: 0 10px; color:#11A;}\n\n.message > div {\n  display: block;\n  background-color: #FFE;\n  padding: 6px;\n  margin: 4px 0px;\n  border-radius: 10px; }\n\n.message .time {\n  font-size: 8px;\n  color: silver;\n  margin-bottom: 0; }\n\n.message .index:after {\n  content: \': \'; }\n\n.message.mine > div, .message.their > div {\n  display: inline-block; }\n\n.message.mine > div {\n  border-bottom-left-radius: 0;\n  position: relative; }\n\n.message.mine > div:before {\n  content: \"\";\n  width: 0;\n  height: 0;\n  border-bottom: 12px solid #FFE;\n  border-left: 8px solid transparent;\n  bottom: 0;\n  left: -8px;\n  position: absolute; }\n\n.message.their {\n  text-align: right; }\n\n.message.their > div {\n  color:#11A;background-color: #0ff;\n  border-bottom-right-radius: 0;\n  right: 0;\n  position: relative; }\n\n.message.their > div:after {\n  content: \"\";\n  width: 0;\n  height: 0;\n  border-bottom: 12px solid #CCF;\n  border-right: 8px solid transparent;\n  bottom: 0;\n  right: -8px;\n  position: absolute; }\n\n.message.their .time {\n  color: #8992D6; }\n", b = document.createElement("style"); b.type = "text/css", b.styleSheet ? b.styleSheet.cssText = a : b.appendChild(document.createTextNode(a)), (document.head || document.getElementsByTagName("head")[0]).appendChild(b) }();

'use strict';

angular.module('ngChatbox', []).directive('ngChatbox', function () {
	return {
		templateUrl: '/chatbox.html',
		replace: true,
		scope: {
			messages: '=ngModel'
		},
		link: function link($scope, element, attrs, ctrl) {
			$scope.wrap = element[0].querySelector(".wrap");
			$scope.holder = element[0].querySelector(".scroller");
		},
		controller: ["$scope", function controller($scope) {
			$scope.$watch('messages.length', function (val) {
				if (!val) return void 0;
				setTimeout(function () {
					$scope.holder.scrollTop = $scope.wrap.scrollHeight + 1000;
				}, 0);
			});
		}]
	};
}).filter('chatboxExtractText', function () {
	return function (msg) {
		return msg instanceof Object ? msg.text : msg;
	};
});

angular.module("ngChatbox").run(["$templateCache", function ($templateCache) {
	$templateCache.put("/chatbox.html", "<div class=\"holder\">\r\n	<div class=\"scroller\">\r\n		<div class=\"wrap\">\r\n			<div class=\"message {{::msg.own}}\" ng-repeat=\"msg in messages\">\r\n				<div>\r\n					{{:: msg | chatboxExtractText }}\r\n					<p class=\"time\" ng-if=\"msg.time\">{{::msg.time}}</p>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>\r\n");
}]);