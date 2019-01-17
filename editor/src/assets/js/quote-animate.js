// Quotes about learning from goodreads -- http://www.goodreads.com/quotes/tag/learning

var quotes = [{
    text: "“To be or not to be, that is the question” ",
    source: "William Shakespeare",
    imageURL: "/imgs/ai-expert.jpg"
  }, {
    text: "“Whether we are based on carbon or on silicon makes no fundamental difference; we should each be treated with appropriate respect.” ",
    source: "—  Arthur C. Clarke, 2010: Odyssey Two",
    imageURL: Math.random() > 0 ? "/imgs/action-ai-android-595804.jpg" : null
  }, {
    text: "“The question of whether a computer can think is no more interesting than the question of whether a submarine can swim.”",
    source: "— Edsger W. Dijkstra",
    imageURL: "/imgs/4800534808_675cb193f5_o.jpg"

  },
  {
    text: "“Maybe the only significant difference between a really smart simulation and a human being was the noise they made when you punched them.” ",
    source: "— Terry Pratchett, The Long Earth",
    imageURL: "/imgs/close-up-code-coding-239898.jpg"
  },
  {
    text: "“By far the greatest danger of Artificial Intelligence is that people conclude too early that they understand it.”",
    source: "— Eliezer Yudkowsky",
    imageURL: Math.random() > 0.5 ? "/imgs/diy-grass-green-6069.jpg" : "/imgs/5426269104_10a14f4ff1_o.jpg"
  },

  {
    text: "“Before we work on artificial intelligence why don’t we do something about natural stupidity?”  ",
    source: "—  Steve Polyak",
    imageURL: "/imgs/analogue-business-control-209306.jpg"
  },

  {
    text: "“People worry that computers will get too smart and take over the world, but the real problem is that they're too stupid and they've already taken over the world.”  ",
    source: "—  Jacob Bronowski",
    imageURL: "/imgs/stock-photo-178857643.jpg"

  },
  {
    text: "“Don't blame you,” said Marvin and counted five hundred and ninety-seven thousand million sheep before falling asleep again a second later. ",
    source: "Douglas Adams, The Hitchhiker's Guide to the Galaxy",
    imageURL: "/imgs/16245563183_f753446f97_o.jpg"
  }
];

var index = 0;
var max = quotes.length - 1;
var delay = .02;

function random(min, max) {
  return (Math.random() * (max - min)) + min;
}

function splitText(str) {
  var retStr = "";
  for (var i = 0; i < str.length; i++) {
    retStr += "<span class='split-animate'" +
      " style='animation-delay:" + i * 0.1 +
      ";-webkit-animation-delay:" + i * 0.1 + ";'>" +
      (str[i] === ' ' ? '&nbsp' : str[i]) + "</span>"
  }
  return retStr;
}

function cycleQuotes(arr, i, sel) {
  var el = angular.element(document.querySelector(sel));
  var message = arr[i].text;
  var htmlStr = message; //splitText(message);
  htmlStr = "<div class='w3-animate-fading'>" + htmlStr + "</div>";

  var source = arr[i].source;
  var htmlStr2 = source; //splitText(source);
  htmlStr2 = "<div style='color:#999' class='w3-animate-fading'>" + htmlStr2 + "</div>";
  imageStr = "<br><br><div class='faded faded-all'><img src=\"" + arr[i].imageURL + "\"></div>";
  var time = message.length;
  el.html(htmlStr + htmlStr2 + imageStr);

  index = index == max ? 0 : (index + 1);

  setTimeout(function () {

    cycleQuotes(quotes, index, ".quote");
  }, 20000);

}

window.addEventListener("load", function () {
  cycleQuotes(quotes, index, ".quote");
});
