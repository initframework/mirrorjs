
window.onload = function () {
   
   // setup mirror js
   mirror.setup();

   // console.log(document.querySelectorAll('#body [data-78]'))
   // document.querySelectorAll('#body [m3d54d6d]')[0].setAttribute('class', "display-4")
   // console.log(document.querySelectorAll('#body [data-78]'))
   // console.log(document.getElementById('firehand').getAttribute('id'));
   // console.log(document.getElementById('firehand').setAttribute('class', "text-danger"));
   // console.log(document.getElementById('firehand').setAttribute('titl', "text-danger was added to class"));
   // console.log(document.getElementById('firehand').getAttribute('id'));

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

