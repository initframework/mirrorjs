
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
      const bodyTxt = parser.__readfileAsText()
      // console.log(bodyTxt);

      // parse the document
      // and extract variables, directives and expressions
      const parsedDoc = parser.__parse(bodyTxt);
      // console.log(parsedDoc);

      // by now, all variables have been registered as a cause to an effect

      // read the documentbody as node object
      // const bodyObj = parser.__readfileAsNode();
      // console.log(bodyObj);

   },

}

let variable_watcher = {};

let variable = {

   __set: function(name, value) {
      // NOTE: the value of the variable could be another variable
      // NOTE: the value of the variable could be an object
      // NOTE: the value of the variable could be an array
      
      // should this be considered when getting it
      window[name] = value == "" ? null : value ;
      this.__register(name)
   },

   __register: function(name) {
      variable_watcher[name] = []
      console.log(variable_watcher);
   },

}

let parser = {

   // parse the document
   // retrieve variables
   // identify expressions
   // identify watchers
   __parse: function(documentArr) {

      let parsedDoc = [], count = 0;

      if (typeof documentArr == "object") {
         
         let var_expecting = false; //, cond_expecting = [false], loop_expecting = [false];
         documentArr.forEach(line => {
            // break each sentence in the line into words
            let sentences = line.split(" ");

            // if no multiple var tag is open
            // single line variables
            if ( var_expecting == false && sentences[0] == "@var" ) {
               // this is a singular variable
               // merge the remaining arrays
               let _variables = sentences.slice(1, sentences.length);
               // merge the variable into a string
               _variables = _variables.join("");
               // accept multiple variables on one line
               // NOTE: EVERY VARIABLE MUST END WITH SEMICOLON
               _variables = _variables.trim().split(";");
               // hence, last element of array is discarded i.e after the last declared variable
               _variables = _variables.slice(0, _variables.length - 1);
               // loop through all
               _variables.forEach(_variable => {
                  // break the string on equal to (=)
                  _variable = _variable.split("=");
                  // get the variable name
                  let _variableName = _variable[0].trim(); // is this sa valid variable name
                  // replace any semi-colon, quote and double-quote
                  let _variableValue = _variable[1].trim().replace(/[";']/gi, ""); // this could be another variable or an array or an object
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
            
            // close vars
            else if ( var_expecting == true && sentences[0] == "@@vars") {
               var_expecting = false;
            }

            // multi line variables
            else if (var_expecting == true) {
               // break each sentence in the line into words
               let _variables = line;
               // get the variable
               // accept multiple variables on one line
               // NOTE: EVERY VARIABLE MUST END WITH SEMICOLON
               _variables = _variables.trim().split(";");
               // hence, last element of array is discarded i.e after the last declared variable
               _variables = _variables.slice(0, _variables.length - 1);
               // loop through all
               _variables.forEach(_variable => {
                  // break the string on equal to (=)
                  _variable = _variable.split("=");
                  // get the variable name
                  let _variableName = _variable[0].trim(); // is this sa valid variable name
                  // replace any semi-colon, quote and double-quote
                  let _variableValue = _variable[1].trim().replace(/[";']/gi, ""); // this could be another variable or an array or an object
                  // parsedDoc[count] = `<mirror type="var" data-${_variableName}=${_variableValue} />`
                  // set the variable as an mjs variable
                  variable.__set(_variableName,_variableValue);
               });
            }

            // open cond
            // NOTE: EVERY conditional stmt could be a watcher on a variable
            else if (sentences[0] == "@cond") {
               // merge the remaining arrays
               let _conds = sentences.slice(1, sentences.length);
               // merge the variable into a string
               _conds = _conds.join("");
               // strip out the conditional brackets
               _conds = _conds.replace(/[)(]/gi, "");
               // console.log(_conds);
            }

            // close cond
            else if (sentences[0] == "@@cond") {

            }

            // read any other html
            else {
               parsedDoc[count] = line;
            }

            // count would only be used for HTML related outputs
            // such as returning the innerHTML of a mirror tag
            count++;
         });
      }

      return parsedDoc;

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

let renderer = {

}

let evaluator = {

}

let generators = {

}

let spy = {

}