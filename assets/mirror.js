
/*
   MirrorJs Features
   * Interpolation
   * Conditional Rendering
   * List Rendering
   * Event Driven Statefulness
   * Reactive
*/

let mirror = {

   // setup the mirror for reflecting changes
   setup: function() {

      // read the document body as text array
      const bodyTxt = __parser.__readfileAsText()
      // console.log(bodyTxt);

      // parse the document
      // and extract variables, directives and expressions
      const parsedDoc = __parser.__parse(bodyTxt);
      _bodyStates.push(parsedDoc);
      // console.log(parsedDoc);

      // the document body can now replace the original body
      document.getElementById("body").innerHTML = parsedDoc.join("\n");
      // console.log(parsedDoc);

      // by now, all variables have been registered as a cause to an effect and watchers too must have been registered
      // so now let's find all watchers on these variables and map them to their variables
      __variable.__addWatchersToVariables();

      // now we register the contents of those watchers that are of cond or loop directives
      __watcher.__registerContents();

      // now lets run the first render
      // let's start with expressions
      __reflector.__setupReflect();

      // hold the current variable states in the spy
      __spy.__store();

      // read the documentbody as node object
      // const bodyObj = __parser.__readfileAsNode();
      // console.log(bodyObj);

   },

   // reflect changes
   reflect: function() {

      console.log("detecting changes...");
      
      // hold the current state
      __spy.__store();

      // call the spy method to see variables whose values have changed
      __spy.__compare();

   },

   // set variables from js
   set: function(variable, value = null) {
      __variable.__set(variable, value);
   }

}

let __variable = {

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
      // regex for matching booleans
      let bool_regex = /[(true|false)]/gi

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

      // NOTE: the value of the variable could be a boolean
      else if (bool_regex.test(value)) {
         _value = Boolean(value);
      }

      // NOTE: the value of the variable could be an integer
      else {
         _value = Number(value);
      }

      // find out if the variable has been registered before
      if (!_variables.includes(name)) {
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
      if (!_variables.includes(name)) {
         // register the variable
         _variables.push(name);
         // register the variable to match a watcher
         _variable_watchers[name] = [];
      }
   },

   __addWatchersToVariables: function() {
      // for every registered watcher
      // TODO: optimize this process later with memoization
      for (const property in _watchers) {
         if (_watchers.hasOwnProperty(property)) {
            // the watcher
            const watcher = _watchers[property];
            // hold its properties
            const index = watcher.index, action = watcher.action;
            // now iterate over every registered variable
            _variables.forEach(variable => {
               // using regex
               let pattern = variable.replace(/[$]/g,"[$]")+"(?![a-zA-Z0-9_])";
               let regex = new RegExp(pattern);
               // find out if the variable is referenced in the action of the watcher
               if (regex.test(action)) {
                  // add the index of the watcher to the variable watcher
                  _variable_watchers[variable].push(index);
               }
            });
         }
      }
   },

}

let __watcher = {

   __register: function(index,type,action) {
      _watchers[index] = {
         index: index,
         type: type,
         action: action,
         content: null,
         children: []
      };
   },

   __addChildren: function(parent, child) {
      if (_watchers.hasOwnProperty(parent)) {
         // register as a child watcher to this loop node
         const watcher = _watchers[parent];
         watcher.children.push(child);
      }
   },

   // temporary stack
   __registerLoopWatcher: function(elemIndex, newElemIndex, needleRegex, needle, expectingLoopIndex = false, loopIndexRegex = null, loopIndex = null) {
      // if not in array, create array and push; else push.
      if (!_loop_watchers.hasOwnProperty(elemIndex)) {
         _loop_watchers[elemIndex] = [];
         _loop_watchers[elemIndex].push({index: newElemIndex, needleRegex: needleRegex, needle: needle, expectKey: expectingLoopIndex, loopIndexRegex: loopIndexRegex, loopIndex: loopIndex });
      } else {
         _loop_watchers[elemIndex].push({index: newElemIndex, needleRegex: needleRegex, needle: needle, expectKey: expectingLoopIndex, loopIndexRegex: loopIndexRegex, loopIndex: loopIndex });
      }
   },

   __registerContents: function() {
      // for each registered watcher
      for (const property in _watchers) {
         if (_watchers.hasOwnProperty(property)) {
            const watcher = _watchers[property];
            // register its content if its type is a cond or a loop
            if (watcher.type == "cond" || watcher.type == "loop" || watcher.type == "loop-in" || watcher.type == "loop-of") {
               watcher.content = document.getElementById(watcher.index).innerHTML
            }
         }
      }
   },

}

let __parser = {

   // parse the document
   // retrieve variables
   // identify expressions
   // create watchers
   // make the new html body
   __parse: function(documentArr) {

      let parsedDoc = [], count = 0;

      if (typeof documentArr == "object") {
         
         let var_open = false; //, cond_expecting = [false], loop_expecting = [false];
         let loop_index = null; let loop_index_stack = [];
         documentArr.forEach(line => {
            // break each sentence in the line into words
            let sentences = line.split(" ");

            // if no multiple var tag is open
            // single line variables
            if ( var_open == false && sentences[0] == "@var" ) {
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
               _variables.forEach(_variables => {
                  // break the string on equal to (=)
                  _variables = _variables.split("=");
                  // get the variable name
                  let _variableName = _variables[0].trim(); // is this sa valid variable name
                  // replace any semi-colon, quote and double-quote
                  let _variableValue = _variables[1].trim().replace(/[;]/gi, ""); // this could be another variable or an array or an object ***
                  // set the variable as an mjs variable
                  __variable.__set(_variableName,_variableValue);
               });
            }

            // open vars
            else if ( var_open == false && sentences[0] == "@vars" ) {
               // @vars cannot be inside @vars
               var_open = true;
               // i'd be expecting another variable
               // hence you can't enter anything not a variable here
            }
            
            // close vars
            else if ( var_open == true && sentences[0] == "@@vars") {
               var_open = false;
            }

            // multi line variables
            else if (var_open == true) {
               // break each sentence in the line into words
               let _variables = line;
               // get the variable
               // accept multiple variables on one line
               // NOTE: EVERY VARIABLE MUST END WITH SEMICOLON
               _variables = _variables.trim().split(";");
               // hence, last element of array is discarded i.e after the last declared variable
               _variables = _variables.slice(0, _variables.length - 1);
               // loop through all
               _variables.forEach(_variables => {
                  // break the string on equal to (=)
                  _variables = _variables.split("=");
                  // get the variable name
                  let _variableName = _variables[0].trim(); // is this sa valid variable name
                  // replace any semi-colon, quote and double-quote
                  // BUG: it is trimming out values improperly
                  let _variableValue = _variables[1].trim().replace(/[;]/gi, ""); // this could be another variable or an array or an object
                  // set the variable as an mjs variable
                  __variable.__set(_variableName,_variableValue);
               });
            }

            // open loops
            else if (sentences[0] == "@for") {
               // merge the remaining arrays
               let _expr = sentences.slice(1, sentences.length);
               // merge the variable into a string
               _expr = _expr.join(" ").trim();
               // strip out the conditional brackets
               _expr = _expr.replace(/[)(]/gi, ""); // ***
               // set watcher attributes
               const type = "loop", index = __generator.__hash(), action = `${_expr}` ;
               // register condition as a watcher
               __watcher.__register(index,type,action);
               // make html
               parsedDoc.push(`<mirror id="${index}">`);
               loop_index_stack.push(index);
               loop_index = index;
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

               // consider an outer loop
               if (loop_index != null) {
                  // set watcher attributes
                  const type = "loop-cond", index = __generator.__hash(), 
                  action = 
                  `if ${_conds} { 
                     document.getElementById('${index}').style.display = 'contents'; 
                  } else { 
                     document.getElementById('${index}').style.display = 'none'; 
                  }` ;
                  // register condition as a watcher
                  __watcher.__register(index,type,action);
                  // make html
                  parsedDoc.push(`<mirror id="${index}">`);
                  // register this watcher index as a child to parent loop
                  __watcher.__addChildren(loop_index, index);
               } else {
                  // set watcher attributes
                  const type = "cond", index = __generator.__hash(), 
                  action = 
                  `if ${_conds} { 
                     document.getElementById('${index}').style.display = 'contents'; 
                  } else { 
                     document.getElementById('${index}').style.display = 'none'; 
                  }` ;
                  // register condition as a watcher
                  __watcher.__register(index,type,action);
                  // make html
                  parsedDoc.push(`<mirror id="${index}">`);
               }
            }

            // close loop
            else if (sentences[0] == "@endfor") {
               // do nothing for now
               parsedDoc.push(`</mirror>`);
               // remove the current loop
               loop_index_stack.pop();
               // nullify the loop index
               loop_index = null;
            }

            // close cond
            else if (sentences[0] == "@endif") {
               // do nothing for now
               parsedDoc.push(`</mirror>`);
            }

            // read expressions and any other html
            else {

               // read expressions in each line
               // a basic expression
               let expr_regex = /[{]{2}((?![{]{2})(?![}]{2}).)+[}]{2}/gi

               // an expression in an attribute
               let attr_expr_regex = /(:[a-z-]+=)(")((?![:]{1}[a-z]+).)+(")/gi

               // variables to be used for expressions
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
                  
                  // make attributes values independent

                  // set the expression attribute type and generate an index for this attribute 
                  type = loop_index != null ? "loop-expr-attr" : "expr-attr" , index = __generator.__hash();

                  // match every expression in it
                  while (inner_match = expr_regex.exec(_attrValue)) {

                     // remove the double curly braces
                     matchNoCurls = inner_match[0].toString().replace(/([{]{2}|[}]{2})/gi, "");

                     // regex wahalas = .,+,*,$,(,),[,]
                     let regex = matchNoCurls;
                     // replace .
                     regex = regex.replace(/\.+/gi, "\\.");
                     regex = regex.replace(/\++/gi, "\\+");
                     regex = regex.replace(/\*+/gi, "\\*");
                     // replace $
                     regex = regex.replace(/\(+/gi, "\\(");
                     regex = regex.replace(/\)+/gi, "\\)");
                     regex = regex.replace(/\[+/gi, "\\[");
                     regex = regex.replace(/\]+/gi, "\\]");
                     regex = regex.replace(/\$+/gi, "[$]");
                     matchNoCurlsRegex = new RegExp(regex+'*', "gi");
                     // console.log(matchNoCurlsRegex);

                     // matchNoCurlsRegex = new RegExp(matchNoCurls.replace(/[(]+/gi, "[(]").replace(/[)]+/gi, "[)]").replace(/[$]+/gi, "[$]")+'*', "gi");

                     // set its own action
                     action = 
                     `const attr = document.querySelectorAll('#body [${index}]')[0]; if (attr != null) { attr.${_attrName} = attr.${_attrName}.replace(${matchNoCurlsRegex}, ${matchNoCurls}); } `;

                  }
                  

                  // remove the double curly braces
                  _attrValue = _attrValue.replace(/([{]{2}|[}]{2})/gi, "");
                  // register expression as a watcher
                  __watcher.__register(index,type,action);
                  // replace match with index
                  _attrDoc = `${_attrName}=${_attrValue} ${index}`;
                  line = line.replace(match[0], _attrDoc);
                  // console.log(line);

                  // Is it loop dependent? consider outer loop
                  if (loop_index != null) {
                     // register this watcher index as a child to parent loop
                     __watcher.__addChildren(loop_index, index);
                  } 
                  
               }

               // match the remaining type of expressions
               while (match = expr_regex.exec(line))
               {
                  // get the expression
                  _expr = match[0];
                  // remove the double curly braces
                  _expr = _expr.replace(/([{]{2}|[}]{2})/gi, "");
                  // consider outer loop
                  if (loop_index != null) {
                     // set watcher attributes
                     type = "loop-expr-tag", index = __generator.__hash(), action = `const el = document.getElementById("${index}"); if (el != null) { el.innerHTML = ${_expr}; }` ;
                     __watcher.__register(index,type,action);
                     // replace match with index
                     line = line.replace(match[0], `<span id="${index}">${_expr}</span>`);
                     // register this watcher index as a child to parent loop
                     __watcher.__addChildren(loop_index, index);
                  } else {
                     // set watcher attributes
                     type = "expr-tag", index = __generator.__hash(), action = `const el = document.getElementById("${index}"); if (el != null) { el.innerHTML = ${_expr}; }` ;
                     __watcher.__register(index,type,action);
                     // replace match with index
                     line = line.replace(match[0], `<span id="${index}">${_expr}</span>`);
                  }
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

let __reflector = {

   __setupReflect: function() {
      // for each watcher
      for (const property in _watchers) {

         if (_watchers.hasOwnProperty(property)) {
            const watcher = _watchers[property];
            
            // loops
            if (watcher.type == "loop") {
               // TODO: optimize this with memoization
               // store an id to indicate if the real action has been saved in the watcher as a new property
               
               // clear the inner elements
               let el = document.getElementById(watcher.index)
               el.innerHTML = "";
               // form the main action to populate the el' children
               // break the separator to extract the used variable name
               let action = watcher.action.split(" in ");
               // let cnt = watcher.content;

               // some iterations want to get the index too
               // this is indicated with the index variable with a comma before the needle variable
               let index_needle = action[0].trim();
               // if it needs an index
               let index_needle_break = index_needle;
               let loop_index = needle = null;
               if ( index_needle_break.toString().search(",") != -1) {
                  index_needle_break = index_needle_break.split(",")
                  loop_index = index_needle_break[0].trim();
                  needle = index_needle_break[1].trim();
               } else {
                  needle = index_needle_break.trim();
               }
               let haystack = action[1].trim();
               // ((?! )(?!<)(?!>).)
               // needle regex
               let needleRegex = new RegExp(needle.replace(/[$]+/gi, "[$]")+'*',"gi");
               // loop index regex
               let loopIndexRegex = loop_index == null ? null : new RegExp(loop_index.replace(/[$]+/gi, "[$]")+'*',"gi");
               let loop_index_req = loop_index == null ? false : true ;

               // console.log(loopIndexRegex, loop_index);
               // console.log(needleRegex);
               action = 
               `var count = 0;
               for (const key in ${haystack}) { 
                  if (${haystack}.hasOwnProperty(key)) {
                     let cnt = \`${watcher.content}\`; 
                     let re = ${needleRegex};
                     let loop_index = key;
                     let loop_index_req = ${loop_index_req};
                     let loopIndexRegex = ${loopIndexRegex};
                     
                     // re-index the watcher
                     // get all children of the loop watcher
                     if (_watchers['${watcher.index}'].children != []) {
                        // can we use memoization here for eficiency sake
                        (_watchers['${watcher.index}'].children).forEach(index => {
                           
                           // create regex for matching the id
                           let indexRegex = new RegExp(index,"gi");
                           
                           // register a new watcher index for the watcher
                           let newIndex = index + count;

                           // If the action is expecting to use the loop index key
                           if (loop_index_req == true) {
                              __watcher.__registerLoopWatcher(index, newIndex, re, '${haystack}'+'['+count+']', true, loopIndexRegex, loop_index);
                           } else {
                              __watcher.__registerLoopWatcher(index, newIndex, re, '${haystack}'+'['+count+']');
                           }

                           // loop indexes being expected are to be considered here too, they must have been interpolated
                           // if the loopIndexRegex matches the expected loop index
                           // console.log(index, loopIndexRegex, loop_index, re);

                           // renew the id for the html
                           cnt = cnt.replace(indexRegex, newIndex);

                        });
                     }
                     
                     // make the expression executable
                     cnt = cnt.replace(re, '${haystack}'+'['+count+']');
                     document.getElementById('${watcher.index}').innerHTML += cnt;
                     // console.log(cnt);
                     // increment counter
                     count++;
                  }
               }`;
               // console.log(action);
               // action = `for (let ${needle} in ${haystack}) { let cnt = \`${watcher.content}\`; cnt = cnt.replace(${needleRegex}, ${Object.assign({}, needle)}); document.getElementById('${watcher.index}').innerHTML += cnt }`;
               // console.log("loop", action);
               __evaluator.__execute(action);
            }

            // loop dependent conditions
            if (watcher.type == "loop-cond") {
               let realIndex = watcher.index;
               // console.log(realIndex);
               // loop through all instances of the index
               (_loop_watchers[realIndex]).forEach(loop_index => {
                  let action = watcher.action;
                  // console.log(action);
                  // create regex for matching the id in the action
                  let indexRegex = new RegExp(realIndex,"gi");
                  // console.log(indexRegex);
                  // renew the id in the action stmt
                  action = action.replace(indexRegex, loop_index.index);
                  // console.log(action);
                  // replace the old needle with a new one
                  action = action.replace(loop_index.needleRegex, loop_index.needle);
                  // console.log(action);
                  // html coverts > to &gt; and < to &lt;
                  // so let's reverse it
                  action = action.replace(/&gt;*/gi, ">").replace(/&lt;*/gi, "<");
                  // console.log(action);
                  // evaluate the new action
                  __evaluator.__execute(action);
               });
            }

            // execute conditions
            if (watcher.type == "cond") {
               // console.log("cond", watcher.action);
               // html coverts > to &gt; and < to &lt;
               // so let's reverse it
               let action = watcher.action.replace(/&gt;*/gi, ">").replace(/&lt;*/gi, "<");
               __evaluator.__execute(action);
            }

            // loop dependent expressions
            if (watcher.type == "loop-expr-tag" || watcher.type == "loop-expr-attr") {
               
               let realIndex = watcher.index;
               // console.log(realIndex);
               // loop through all instances of the index
               // console.log(_loop_watchers[realIndex]);
               (_loop_watchers[realIndex]).forEach(loop_index => {
                  let action = watcher.action;
                  // create regex for matching the id in the action
                  let indexRegex = new RegExp(realIndex,"gi");
                  // renew the id in the action stmt
                  action = action.replace(indexRegex, loop_index.index);
                  // replace the old needle with a new one

                  // console.log(action);
                  // consider that the action might be a loop index expression
                  if (loop_index.expectKey == true) {
                     action = action.replace(loop_index.needleRegex, loop_index.needle).replace(loop_index.loopIndexRegex, loop_index.loopIndex);
                  } else {
                     action = action.replace(loop_index.needleRegex, loop_index.needle);
                  }
                  // console.log(action);
                  // evaluate the new action
                  __evaluator.__execute(action);
               });
               // loop_index_stack.pop();
            }

            // expressions
            if (watcher.type == "expr-tag" || watcher.type == "expr-attr") {
               // console.log("expr", watcher.action);
               // console.log(watcher.action);
               __evaluator.__execute(watcher.action);
            }

         }
      }
   },

   __reflect: function(watcher) {

      watcher = _watchers[watcher];
      
      // loops
      if (watcher.type == "loop") {
         // TODO: optimize this with memoization
         // store an id to indicate if the real action has been saved in the watcher as a new property
         
         // clear the inner elements
         let el = document.getElementById(watcher.index)
         el.innerHTML = "";
         // form the main action to populate the el' children
         // break the separator to extract the used variable name
         let action = watcher.action.split(" in ");
         // let cnt = watcher.content;

         // some iterations want to get the index too
         // this is indicated with the index variable with a comma before the needle variable
         let index_needle = action[0].trim();
         // if it needs an index
         let index_needle_break = index_needle;
         let loop_index = needle = null;
         if ( index_needle_break.toString().search(",") != -1) {
            index_needle_break = index_needle_break.split(",")
            loop_index = index_needle_break[0].trim();
            needle = index_needle_break[1].trim();
         } else {
            needle = index_needle_break.trim();
         }
         let haystack = action[1].trim();
         // ((?! )(?!<)(?!>).)
         // needle regex
         let needleRegex = new RegExp(needle.replace(/[$]+/gi, "[$]")+'*',"gi");
         // loop index regex
         let loopIndexRegex = loop_index == null ? null : new RegExp(loop_index.replace(/[$]+/gi, "[$]")+'*',"gi");
         let loop_index_req = loop_index == null ? false : true ;

         // console.log(loopIndexRegex, loop_index);
         // console.log(needleRegex);
         action = 
         `var count = 0;
         for (const key in ${haystack}) { 
            if (${haystack}.hasOwnProperty(key)) {
               let cnt = \`${watcher.content}\`; 
               let re = ${needleRegex};
               let loop_index = key;
               let loop_index_req = ${loop_index_req};
               let loopIndexRegex = ${loopIndexRegex};
               
               // re-index the watcher
               // get all children of the loop watcher
               if (_watchers['${watcher.index}'].children != []) {
                  // can we use memoization here for eficiency sake
                  (_watchers['${watcher.index}'].children).forEach(index => {
                     
                     // create regex for matching the id
                     let indexRegex = new RegExp(index,"gi");
                     
                     // register a new watcher index for the watcher
                     let newIndex = index + count;

                     // If the action is expecting to use the loop index key
                     if (loop_index_req == true) {
                        __watcher.__registerLoopWatcher(index, newIndex, re, '${haystack}'+'['+count+']', true, loopIndexRegex, loop_index);
                     } else {
                        __watcher.__registerLoopWatcher(index, newIndex, re, '${haystack}'+'['+count+']');
                     }

                     // loop indexes being expected are to be considered here too, they must have been interpolated
                     // if the loopIndexRegex matches the expected loop index
                     // console.log(index, loopIndexRegex, loop_index, re);

                     // renew the id for the html
                     cnt = cnt.replace(indexRegex, newIndex);

                  });
               }
               
               // make the expression executable
               cnt = cnt.replace(re, '${haystack}'+'['+count+']');
               document.getElementById('${watcher.index}').innerHTML += cnt;
               // console.log(cnt);
               // increment counter
               count++;
            }
         }`;
         // console.log(action);
         // action = `for (let ${needle} in ${haystack}) { let cnt = \`${watcher.content}\`; cnt = cnt.replace(${needleRegex}, ${Object.assign({}, needle)}); document.getElementById('${watcher.index}').innerHTML += cnt }`;
         // console.log("loop", action);

         __evaluator.__execute(action);

         // if the loop has children
         if (_watchers[watcher.index].children != []) {
            // loop through them
            let children = _watchers[watcher.index].children;
            __spy.__trigger(children);
         }
      }

      // loop dependent conditions
      if (watcher.type == "loop-cond") {
         let realIndex = watcher.index;
         // console.log(realIndex);
         // loop through all instances of the index
         (_loop_watchers[realIndex]).forEach(loop_index => {
            let action = watcher.action;
            // console.log(action);
            // create regex for matching the id in the action
            let indexRegex = new RegExp(realIndex,"gi");
            // console.log(indexRegex);
            // renew the id in the action stmt
            action = action.replace(indexRegex, loop_index.index);
            // console.log(action);
            // replace the old needle with a new one
            action = action.replace(loop_index.needleRegex, loop_index.needle);
            // console.log(action);
            // html coverts > to &gt; and < to &lt;
            // so let's reverse it
            action = action.replace(/&gt;*/gi, ">").replace(/&lt;*/gi, "<");
            // console.log(action);
            // evaluate the new action
            __evaluator.__execute(action);
         });
      }

      // execute conditions
      if (watcher.type == "cond") {
         // console.log("cond", watcher.action);
         // html coverts > to &gt; and < to &lt;
         // so let's reverse it
         let action = watcher.action.replace(/&gt;*/gi, ">").replace(/&lt;*/gi, "<");
         __evaluator.__execute(action);
      }

      // loop dependent expressions
      if (watcher.type == "loop-expr-tag" || watcher.type == "loop-expr-attr") {
         
         let realIndex = watcher.index;
         // console.log(realIndex);
         // loop through all instances of the index
         // console.log(_loop_watchers[realIndex]);
         (_loop_watchers[realIndex]).forEach(loop_index => {
            let action = watcher.action;
            // create regex for matching the id in the action
            let indexRegex = new RegExp(realIndex,"gi");
            // renew the id in the action stmt
            action = action.replace(indexRegex, loop_index.index);
            // replace the old needle with a new one

            // console.log(action);
            // consider that the action might be a loop index expression
            if (loop_index.expectKey == true) {
               action = action.replace(loop_index.needleRegex, loop_index.needle).replace(loop_index.loopIndexRegex, loop_index.loopIndex);
            } else {
               action = action.replace(loop_index.needleRegex, loop_index.needle);
            }
            // console.log(action);
            // evaluate the new action
            __evaluator.__execute(action);
         });
         // loop_index_stack.pop();
      }

      // expressions
      if (watcher.type == "expr-tag" || watcher.type == "expr-attr") {
         // console.log("expr", watcher.action);
         // console.log(watcher.action);
         __evaluator.__execute(watcher.action);
      }

   }

}

let __evaluator = {

   __execute: function(action) {
      return Function('"use strict";' + action + ';')();
   },

}

let __generator = {

   __hash: function() {
      let hex = "0123456789abcdef", hash = "";
      for (let max = 8; max > 0; max--) {
         let i =  Math.ceil(Math.random() * 16) - 1;
         hash += hex.charAt(i)
      }
      return `mjs-${hash}`;
   }

}

let __spy = {

   // find changes
   __store: function() {
      const _var = {};
      _variables.forEach(variable => {
         let value = __evaluator.__execute(`return ${variable};`);
         // Stringify the value, so that it doesn't change as variables changes
         _var[variable] = JSON.stringify(value);
      });

      _spy_variables.push(_var);

   },

   __compare: function() {
      console.log("comapring states...");

      // compare the current state and the previous
      let current = _spy_variables[_spy_variables.length - 1];
      let prev = _spy_variables[_spy_variables.length - 2];

      _variables.forEach(variable => {
         
         // here, the stringified version of the variables are been compared
         if (prev[variable] != current[variable]) {
            // this variable changed
            // get its watchers
            console.log(variable + " changed");
            let watchers = _variable_watchers[variable];

            console.log(watchers);

            // trigger its watchers
            this.__trigger(watchers);
         }

      });

      _spy_variables.splice(0, 1);

   },

   __trigger: function(watchers) {

      // trigger the reflector on these watchers
      watchers.forEach(watcher => {
         __reflector.__reflect(watcher);
      });

   }

}

let _                   = mirror;
let _spy_variables      = [];
let _bodyStates         = [];
let _variable_watchers  = {};
let _watchers           = {};
let _variables          = [];
let _loop_watchers      = {};
