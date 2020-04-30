
/*
   MirrorJs Features
   * Expressions
   * Directives
   * List Rendering
   * Events
   * Statefulness
*/

let mirror = {

   // initiate the framework
   init: function() {

      // convert the variables
      
      // read the document body as text
      const bodyTxt = this.__readfileAsText()
      console.log(bodyTxt);


      const bodyObj = this.__readfileAsNode();
      console.log(bodyObj);


      // parse the document


   },

   __readfileAsText: function() {
      // These provide a tree of all elements
      const body = document.getElementById("body");
      // the document nodes as a NodeList
      let elements = body.innerHTML;
      // separate into line
      elements = elements.split("\n");
      // remove empty lines
      let documentArr = [], count = 0;
      elements.forEach(line => {
         if (line.trim().length != 0) {
            documentArr[count] = line.trim();
            count++;
         }
      });
      
      return documentArr;
   },

   __readfileAsNode: function() {
      // These provide a tree of all elements
      const body = document.getElementById("body");
      // the document nodes as a NodeList
      let elements = body.childNodes;
      // the document nodes as an Object
      documentObj = Object.assign({}, elements);
      
      return documentObj;
   },

}

let variable = {

   __set: function(documentArr) {
      
      if (typeof documentArr == "object") {
         let documentVar = [], count = 0
         documentArr.forEach(line => {
            // break each sentence in the line into words
            let sentences = line.split("/[ ]/");
            if (sentences[0] == "@var") {

            }
         });
      }

   },

   // function to set all variables coming from the server, loaded in the vars element
   __get: function() {
      // get the dataset in the vars element
      var data = document.getElementsByTagName("vars")[0].dataset;
      // convert them all to objects
      data = Object.assign({}, data)
      // set them to global variables
      for (const vars in data) {
         if (data.hasOwnProperty(vars)) {
            window['_' + vars] = data[vars];
         }
      }
   },

}

let renderer = {

}

let watcher = {

}

let evaluator = {

}

let parser = {



}

let generators = {

}

let spy = {

}