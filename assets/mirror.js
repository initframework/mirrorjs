
/*
   MirrorJs Features
   * Expressions
   * Directives
   * List Rendering
   * Events
   * Statefulness
*/

let mirror = {

   // setup the mirror for reflecting changes
   setup: function() {

      // read the document body as text array
      const bodyTxt = this.__readfileAsText()
      console.log(bodyTxt);

      // parse the document
      // and extract variables, directives and expressions
      const parsedDoc = parser.__parse(bodyTxt);
      console.log(parsedDoc);

      // read the documentbody as node object
      // const bodyObj = this.__readfileAsNode();
      // console.log(bodyObj);

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

   __set: function(name, value) {
      window[name] = value;
   },

}

let parser = {

   __parse: function(documentArr) {

      let parsedDoc = [], count = 0;

      if (typeof documentArr == "object") {
         
         let var_expecting = false; //, cond_expecting = [false], loop_expecting = [false];
         documentArr.forEach(line => {
            // break each sentence in the line into words
            let sentences = line.split(" ");

            // if no multiple var tag is open
            // search for variables
            if ( var_expecting == false && sentences[0] == "@var" ) {
               // this is a singular variable
               // merge the remaining arrays
               let _variables = sentences.slice(1, sentences.length);
               // merge the variable into a string
               _variables = _variables.join("");
               // accept multiple variables on one line
               // NOTE: EVERY VARIABLE MUST END WITH SEMICOLON
               _variables = _variables.trim().substring(0, _variables.trim().length - 1).split(";");
               // hence, last element of array is discarded i.e after the last declared variable
               // loop through all
               _variables.forEach(_variable => {
                  
                  // break the string on equal to (=)
                  _variable = _variable.split("=");
                  // get the variable name
                  let _variableName = _variable[0]; // is this sa valid variable name
                  // replace any semi-colon, quote and double-quote
                  let _variableValue = _variable[1].replace(/[";']/gi, ""); // this could be another variable or an array or an object
                  // parsedDoc[count] = `<mirror type="var" data-${_variableName}=${_variableValue} />`
                  // set the variable as an mjs variable
                  variable.__set(_variableName,_variableValue);

               });
               
               
            }

            // open vars
            else if ( var_expecting == false && sentences[0] == "@vars" ) {
               // @vars cannot be inside @vars
               var_expecting = true;
               // i'd be expecting another variable
               // hence you can't enter anything not a variable here
            }

            // else if (var_expecting == true) {
            //    // get the variable
            //    // break the string on equal to (=)
            //    _variable = _variable.split("=");
            //    // get the variable name
            //    let _variableName = _variable[0]; // is this sa valid variable name
            //    // replace any semi-colon, quote and double-quote
            //    let _variableValue = _variable[1].replace(/[";']/gi, ""); // this could be another variable or an array or an object
            //    // parsedDoc[count] = `<mirror type="var" data-${_variableName}=${_variableValue} />`
            //    // set the variable as an mjs variable
            //    variable.__set(_variableName,_variableValue);
            // }

            // close vars
            else if (sentences[0] == "@@vars") {
               var_expecting[var_expecting.length - 1] == false;
            }

            // open cond
            else if (sentences[0] == "@vars") {

            }

            // close cond
            else if (sentences[0] == "@vars") {

            }

            else {
               parsedDoc[count] = line;
            }

            count++;
         });
      }

      return parsedDoc;

   }

}

let renderer = {

}

let watcher = {

}

let evaluator = {

}

let generators = {

}

let spy = {

}