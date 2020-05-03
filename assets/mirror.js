
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

      // the document body can now replace the original body
      document.getElementById("body").innerHTML = parsedDoc.join("\n");
      // console.log(parsedDoc);

      // by now, all variables have been registered as a cause to an effect and watchers too must have been registered
      // so now let's find all watchers on these variables and map them to their variables
      variable.__addWatchersToVariables();

      // now we register the contents of those watchers that are of cond or loop directives
      watcher.__registerContents();

      // now lets run the first render
      // let's start with expressions
      renderer.__expressions(parsedDoc.join(""))

      // read the documentbody as node object
      // const bodyObj = parser.__readfileAsNode();
      // console.log(bodyObj);

   },

}

let _variable_watcher = {};
let _watcher = {};
let _variable = [];

let variable = {

   __set: function(name, value) {
      
      let _value = null;

      // regex for matching array
      let obj_regex = /[{]{1}(.)+[}]{1}/gi
      // regex for matching objects
      let arr_regex = /[\[]{1}(.)+[\]]{1}/gi
      // regex for matching another variable
      let var_regex = /[$]{1}(.)+/gi
      // regex for matching strings
      let str_regex = /[('|")]{1}(.)+[('|")]{1}/gi

      // NOTE: the value of the variable could be an empty
      if (value == "") {
         _value = null; 
      }
      // NOTE: the value of the variable could be an array
      // NOTE: the value of the variable could be an object
      else if (arr_regex.test(value) || obj_regex.test(value) ) {
         _value = JSON.parse(value);
      }

      // NOTE: the value of the variable could be another variable
      else if (var_regex.test(value)) {
         _value = window[value];
      }

      // NOTE: the value of the variable could be a string
      else if (str_regex.test(value)) {
         _value = value.replace(/['"]/gi, "").toString();
      }

      // NOTE: the value of the variable could be an integer
      else {
         _value = Number(value)
      }

      // find out if the variable has been registered before
      if (!_variable.includes(name)) {
         // make the variable globally avilable
         window[name] = _value;
         this.__register(name);
      } else {
         // update its value
         window[name] = _value
      }
   },

   __register: function(name) {
      // find out if the variable has been registered before
      if (!_variable.includes(name)) {
         // register the variable
         _variable.push(name);
         // register the variable to match a watcher
         _variable_watcher[name] = [];
      }
   },

   __addWatchersToVariables: function() {
      // for every registered watcher
      // TODO: optimize this process later with memoization
      for (const property in _watcher) {
         if (_watcher.hasOwnProperty(property)) {
            // the watcher
            const watcher = _watcher[property];
            // hold its properties
            const index = watcher.index, action = watcher.action;
            // now iterate over every registered variable
            _variable.forEach(variable => {
               // using regex
               let pattern = variable.replace(/[$]/g,"[$]")+"(?![a-zA-Z0-9_])";
               let regex = new RegExp(pattern);
               // find out if the variable is referenced in the action of the watcher
               if (regex.test(action)) {
                  // add the index of the watcher to the variable watcher
                  _variable_watcher[variable].push(index);
               }
            });
         }
      }
   },

}

let watcher = {

   __register: function(index,type,action) {
      _watcher[index] = {
         index: index,
         type: type,
         action: action,
         content: null
      };
   },

   __registerContents: function() {
      // for each registered watcher
      for (const property in _watcher) {
         if (_watcher.hasOwnProperty(property)) {
            const watcher = _watcher[property];
            // register its content if its type is a cond or a loop
            if (watcher.type == "cond" || watcher.type == "loop") {
               watcher.content = document.getElementById(watcher.index).innerHTML
            }
         }
      }
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
                  let _variableValue = _variable[1].trim().replace(/[;]/gi, ""); // this could be another variable or an array or an object ***
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
                  // BUG: it is trimming out values improperly
                  let _variableValue = _variable[1].trim().replace(/[;]/gi, ""); // this could be another variable or an array or an object
                  // set the variable as an mjs variable
                  variable.__set(_variableName,_variableValue);
               });
            }

            // open cond
            // NOTE: EVERY conditional stmt could be a watcher on a variable
            else if (sentences[0] == "@if") {
               // merge the remaining arrays
               let _conds = sentences.slice(1, sentences.length);
               // merge the variable into a string
               _conds = _conds.join(" ").trim();
               // strip out the conditional brackets
               // _conds = _conds.replace(/[)(]/gi, ""); // ***
               // set watcher attributes
               const type = "cond", index = generator.__hash(), action = `return ${_conds};` ;
               // register condition as a watcher
               watcher.__register(index,type,action);
               // make html
               parsedDoc.push(`<mirror id="${index}">`);
            }

            // open loops
            else if (sentences[0] == "@for") {
               // merge the remaining arrays
               let _expr = sentences.slice(1, sentences.length);
               // merge the variable into a string
               _expr = _expr.join(" ").trim();
               // strip out the conditional brackets
               // _expr = _expr.replace(/[)(]/gi, ""); // ***
               // set watcher attributes
               const type = "loop", index = generator.__hash(), action = `return ${_expr};` ;
               // register condition as a watcher
               watcher.__register(index,type,action);
               // make html
               parsedDoc.push(`<mirror id="${index}">`);
            }

            // close cond and loop
            else if (sentences[0] == "@end") {
               // do nothing for now
               parsedDoc.push(`</mirror>`);
            }

            // read any other html
            else {

               // read expressions in each line
               // a basic expression
               let expr_regex = /[{]{2}((?![{]{2})(?![}]{2}).)+[}]{2}/gi

               // let attr_expr_regex = /(:[a-z]+=)("|')[{]{2}((?![{]{2})(?![}]{2}).)+[}]{2}("|')/gi

               let attr_expr_regex = /(:[a-z-]+=)("|')((?![:]{1}[a-z]+).)+("|')/gi

               // an expression in an attribute
               // let attr_regex = ;

               let _expr = _attr = null;
               let index = action = type = _attrName = _attrValue = _attrDoc = null;
            
               // match an expression in an attribute
               while (match = attr_expr_regex.exec(line))
               {
                  // get the expression
                  _attr = match[0];
                  // break the match to get the attribute and its value
                  _attr = _attr.split("=");
                  // get the attribute name and remove the colon(:)
                  _attrName = _attr[0].trim().replace(":", "");
                  // get the attribute value
                  _attrValue = _attr[1].trim();
                  _attrValue = _attrValue.slice(1, _attrValue.length - 1);
                  // for multiple attibute values, we'd separate with comma
                  _attrValue = _attrValue.replace(/[,]+/gi, "+' '+");
                  console.log(_attrValue);
                  // remove the double curly braces
                  _attrValue = _attrValue.replace(/([{]{2}|[}]{2})/gi, "");
                  // use the attribute name to form the action
                  // add an index to the element
                  index = generator.__hash(); type = "expr-attr"
                  action = `document.querySelectorAll('#body [${index}]')[0].setAttribute("${_attrName}", ${_attrValue})`;
                  // register expression as a watcher
                  watcher.__register(index,type,action);
                  // replace match with index
                  _attrDoc = `${_attrName}="${_attrValue}" ${index}`;
                  line = line.replace(match[0], _attrDoc);
               }
 

               // // match the remaining type of expressions
               while (match = expr_regex.exec(line))
               {
                  // get the expression
                  _expr = match[0];
                  // remove the double curly braces
                  _expr = _expr.replace(/([{]{2}|[}]{2})/gi, "");
                  // register expression as a watcher
                  // set watcher attributes
                  type = "expr-tag", index = generator.__hash(), action = `document.getElementById("${index}").innerHTML = ${_expr}` ;
                  // register expression as a watcher
                  watcher.__register(index,type,action);
                  // replace match with index
                  line = line.replace(match[0], `<span id="${index}">${_expr}</span>`);
               }

               // add to parsed body document
               parsedDoc.push(line);
               
               // count would only be used for HTML related outputs
               // such as returning the innerHTML of a mirror tag
               count++;
            }

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

   __expressions: function(body) {
      // for each watcher
      for (const property in _watcher) {
         if (_watcher.hasOwnProperty(property)) {
            const watcher = _watcher[property];
            if (watcher.type == "expr-tag" || watcher.type == "expr-attr") {
               console.log(watcher.action);
               evaluator.__execute(watcher.action);
               // console.log(result);
               // body = body.replace("{{" + watcher.index + "}}", result);
               // document.getElementById("body").innerHTML = body;
            }
         }
      }
   }

}

let evaluator = {

   __execute: function(action) {
      return Function('"use strict";' + action + ';')();
      // return Function('"use strict";' + action + ' ?? null;')();
   }

}

let generator = {

   __hash: function() {
      let hex = "0123456789abcdef", hash = "";
      for (let max = 8; max > 0; max--) {
         let i =  Math.ceil(Math.random() * 16) - 1;
         hash += hex.charAt(i)
      }
      return `mjs-${hash}`;
   }

}

let spy = {

}