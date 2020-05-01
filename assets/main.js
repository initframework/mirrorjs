
window.onload = function () {
   
   // setup mirror js
   mirror.setup();

   // this.alert(`My name is ${$name}, and I work at ${$company}`);
   $name = "John";
   // this.alert(`My name is ${$name}`);

}

// game playing app, dynamically
// add your game and play it
let game = {

   games: {},

   reg: function(title, game) {
      this.games[title] = game
   },

   play: function(title) {
      Function('"use strict";' + this.games[title])();
   }

}

// game.reg("alerting", "alert('I am home!!!')");
// game.play("alerting");

