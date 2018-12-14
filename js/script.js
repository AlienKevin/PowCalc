//initialize MathQuill
const MQ = MathQuill.getInterface(2);
//retrieve mathField which contains all input and output boxes
const mathField = document.querySelector("#mathField");
// the enumerated number sequence of input, used to generate ids for input boxes
let inputNumber = 0; // 0 means the first input (zero-based index)
// precision of the number of decimal places to retain
const PRECISION = 5;
// the number of digits required to convert the result to exponent form
const EXPONENT_MIN = 9;
// convert to LaTeX or not
let converToLaTexDefault = true;
let convertToLaTeX = converToLaTexDefault;
//create initial input and output on page load
document.addEventListener("DOMContentLoaded", function(event) {
  createNewField();
})
// Create Formula Button
// Get the modal
const modal = document.getElementById('createFunctionWindow');

// Get the button that opens the modal
const btn = document.querySelector("#createFormulaBtn");

// Get the <span> element that closes the modal
const span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

//listen for keyboard events in the input box and update result display in output box
mathField.addEventListener("keyup", function(event) {
  //if key pressed is ENTER, UP Arrow, DOWN Arrow, return immediately
  if (event.keyCode === 13 || event.keyCode === 38 || event.keyCode === 40) {
    return;
  }
  const currentInput = event.target;
  const inputId = currentInput.getAttribute("id");
  const currentInputNumber = Number(inputId.substring(inputId.length - 1)); //retrieve the last character
  const output = mathField.querySelectorAll("span.output")[currentInputNumber];
  //if key pressed is BACKSPACE and current input box is empty, return immediately
  if (event.keyCode === 8 && currentInput.value === "") {
    output.innerHTML = "";
    return;
  }
  if (mathField.querySelector("span#output-" + currentInputNumber) !== null) {
    let result = evalExpr(currentInput);
    if (/[a-zA-Z]/.test(result) && convertToLaTeX) {
      console.log("result: " + result);
      console.log("converting to LaTeX");
      // console.log(result.text());
      if (result.toTeX !== undefined){ // result is a nerdamer expression
        result = result.toTeX("decimal"); // export LaTeX as decimals
      } // else then result is string values like "undefined"
      result = result.replace(/asin/g, "arcsin");
      result = result.replace(/acos/g, "arccos");
      result = result.replace(/atan/g, "arctan");
      result = result.replace(/asec/g, "arcsec");
      result = result.replace(/acsc/g, "arccsc");
      result = result.replace(/acot/g, "arccot");
      console.log("result: " + result);
    }
    result = convertToDecimals(result);
    console.log("result: " + result);
    output.innerHTML = " = " + result;
    console.log(output.innerHTML);
    // console.log(output.getAttribute("id"));
    // beautify result display using MathQuill
    MQ.StaticMath(output);
    convertToLaTeX = converToLaTexDefault;
  }
});
//listen for keydown events of ENTER, UP arrow, and DOWN arrow keys to react immediately
mathField.addEventListener("keydown", function(event) {
  const currentInput = event.target;
  const inputId = currentInput.getAttribute("id");
  const currentInputNumber = Number(inputId.substring(inputId.length - 1)); //retrieve the last character
  if (event.keyCode === 13) { //ENTER key is pressed
    createNewField();
  } else if (event.keyCode === 38) { //UP arrow key is pressed
    event.preventDefault();
    if (inputNumber > 0) {
      let previousInput = mathField.querySelector("#input-" + (currentInputNumber - 1));
      previousInput.focus();
      moveCaretToEnd(previousInput);
    }
  } else if (event.keyCode === 40) { //DOWN arrow key is pressed
    event.preventDefault();
    if (currentInputNumber < inputNumber - 1) {
      let nextInput = mathField.querySelector("#input-" + (currentInputNumber + 1));
      nextInput.focus();
      moveCaretToEnd(nextInput);
    } else {
      createNewField();
    }
  } else if (event.keyCode === 8) { //BACKSPACE key is pressed
    // input is empty and is NOT the first input box
    if (currentInput.value === "" && currentInputNumber != 0) {
      //remove current input box and associated output box
      currentInput.remove();
      const currentOutput = mathField.querySelector("#output-" + (currentInputNumber));
      currentOutput.remove();
      if (currentInputNumber + 1 < inputNumber) {
        const nextInput = mathField.querySelector("#input-" + (currentInputNumber + 1));
        nextInput.focus();
      } else {
        const previousInput = mathField.querySelector("#input-" + (currentInputNumber - 1));
        previousInput.focus();
      }
      //reassign id for all subsequent input and output boxes
      for (let i = currentInputNumber + 1; i < inputNumber; i++) {
        const input = mathField.querySelector("#input-" + i);
        input.setAttribute("id", "input-" + (i - 1));
        const output = mathField.querySelector("#output-" + i);
        output.setAttribute("id", "output-" + (i - 1));
      }
      //decrement total input number
      inputNumber--;
    }
  }
});
//create a new input box
let createNewInput = function() {
  const newInput = document.createElement("input");
  newInput.setAttribute("type", "text");
  newInput.setAttribute("size", "30");
  newInput.setAttribute("spellcheck", false);
  newInput.setAttribute("class", "input");
  newInput.setAttribute("id", "input-" + inputNumber);
  return newInput;
}
//create a new output box
let createNewOutput = function() {
  const newOutput = document.createElement("span");
  newOutput.setAttribute("class", "output");
  newOutput.setAttribute("id", "output-" + inputNumber);
  return newOutput;
}
//create a new field with an input box and output box
let createNewField = function() {
  const newInput = createNewInput();
  const newOutput = createNewOutput();
  mathField.appendChild(newInput);
  mathField.appendChild(newOutput);
  newInput.focus();
  inputNumber++;
}
//move caret to the end of input string
let moveCaretToEnd = function(input) {
  input.setSelectionRange(input.value.length, input.value.length);
}
//evaluate expression inside an input box
let evalExpr = function(input) {
  let tempVars = deleteVars();
  const expr = input.value;
  console.log("expr: " + expr);
  let result;
  if ((result = handleSolveEquations(expr)) === false) {
    // let result = nerdamer.convertToLaTeX(nerdamer(expr).evaluate().text()).toString();
    // let result = nerdamer(expr).evaluate().text("decimal").toString();
    // let result = nerdamer(expr).evaluate().toTeX("decimal");
    try{
      result = nerdamer(expr, undefined, ["numer"]);
      if (result.symbol !== undefined && result.symbol.value === "#"){
        console.log("result.symbol is valid");
        const decimalResult = Number(result.evaluate().text("decimals"));
        if (isFinite(decimalResult)){ // result is a valid number, not Infinity or NaN
          console.log("result is a valid number");
          const exponentialResult = decimalResult.toExponential(PRECISION);
          const significantFigures = decimalResult.toExponential().indexOf("e");
          const resultLength = decimalResult.toString().length;
          const exponent = exponentialResult.substring(exponentialResult.indexOf("e") + 1);
          if (exponent.charAt(0) === "-"){ // negative exponent, a small decimal number
            const exponentMagnitude = exponent.substring(1); // number in the exponent without +/- sign
            if (Number(exponentMagnitude) > PRECISION){
              result = exponentialResult; // return the result in form of exponential
            } else{
              console.log("toFixed precision length: " + (PRECISION + (resultLength - significantFigures)));
              result = decimalResult.toFixed(PRECISION + (resultLength - significantFigures));
            }
          } else{ // positive exponent
            console.log("exponent of result is positive");
            result = decimalResult.toFixed(PRECISION);
          }
          // remove trailing zero
          result = parseFloat(result).toString();
        }
      }
    } catch(e){
      result = "undefined"; // error like 1/0 (division by 0 not allowed)
    }
    // if (result == ""){
    //     result = nerdamer(expr).evaluate().toString();
    // }
  }
  removeImagineryResults(result);
  console.log("result after removing imagineries: " + result);
  // convert fractions in result to decimals
  // result = result.text("decimal");
  // separate long result outputs into multiple lines
  if (result.length > 30) {
    result = result.replace(/,/g, ",<br>");
  }
  console.log("result: " + result);

  return result;
}
let deleteVars = function() {
  let vars = nerdamer.getVars();
  let tempVars = {};
  for (let varName in vars) {
    console.log("var: " + varName);
    tempVars[varName] = vars[varName];
  }
  nerdamer.clearVars();
  return tempVars;
}
let removeImagineryResults = function(result) {
  if (result instanceof Array) { // result is an array of Symbols
    for (let i = 0; i < result.length; i++) {
      let elementDeleted = removeImagineryElements(result[i], result, i);
      if (elementDeleted) {
        i--;
      }
    }
  } else if (result.symbol !== undefined) { // result is an Expression object with Symbol object embedded
    removeImagineryElements(result.symbol, result);
  }
}
let removeImagineryElements = function(symbol, result, index) {
  console.log("symbol: " + symbol);
  let elements = symbol.elements;
  if (elements !== undefined) {
    //remove imaginery results
    console.log("elements: " + elements);
    console.log("elements.length: " + elements.length);
    for (let i = 0; i < elements.length; i++) {
      console.log("element.value: " + elements[i].value);
      if (elements[i] !== undefined && elements[i].value.indexOf("i") >= 0) {
        console.log("imaginery element " + elements[i]);
        elements.splice(i, 1);
        i--;
      }
    }
  } else {
    if (symbol.value !== undefined){
      if (symbol.value.indexOf === undefined){ // values like Infinity
        // do nothing
      } else if (symbol.value.indexOf("i") >= 0){
        if (result instanceof Array) { // prevent deleting result containing function names like "sin"
          result.splice(index, 1);
          return true;
        }
      }
    }
  }
  return false;
}
//handle solveEquations command
let handleSolveEquations = function(expr) {
  const keywordIndex = expr.indexOf("solveEquations");
  if (keywordIndex >= 0) {
    console.log("solveEquations found!");
    const paramStart = keywordIndex + "solveEquations".length;
    const parenOpen = expr.indexOf("(", paramStart);
    console.log("parenOpen: " + parenOpen);
    const parenClose = findMatchingParen(expr, parenOpen);
    console.log("parenClose: " + parenClose);
    const params = expr.substring(parenOpen + 1, parenClose);
    console.log("params: " + params);
    let paramList = [];
    if (params.indexOf("[") >= 0) { // contains a list of equations
      console.log("system of equations found!");
      let bracketOpen = params.indexOf("[");
      let bracketClose = params.indexOf("]");
      let commaIndex = params.indexOf(",", bracketClose);
      paramList[0] = params.substring(bracketOpen + 1, bracketClose).split(",");
      console.log("paramList[0]: " + paramList[0] instanceof Array);
    } else {
      paramList = params.split(",");
    }
    console.log("paramList[0]: " + paramList[0]);
    console.log("paramList[1]: " + paramList[1]);
    let result;
    if (paramList[1] !== undefined) {
      result = nerdamer.solveEquations(paramList[0], paramList[1]);
      console.log("result: " + result);
    } else {
      result = nerdamer.solveEquations(paramList[0]);
      result = formatArrayResults(result);
    }
    convertToLaTeX = false;
    return result;
  } else {
    return false;
  }
}

let formatArrayResults = function(result) {
  let displayed = "{";
  for (let i = 0; i < result.length; i++) {
    displayed += result[i][0] + " = " + result[i][1];
    if (i < result.length - 1) {
      displayed += ",";
    }
  }
  displayed += "}";
  console.log("displayed: " + displayed);
  return displayed;
}

let convertToDecimals = function(result) {
  if (result instanceof Array) { //an array result
    console.log("converting an array result to decimals");
    for (let i = 0; i < result.length; i++) {
      if (result[i] instanceof Array) {
        for (let j = 0; j < result[i].length; j++) {
          result[i][j] = nerdamer(result[i][j], undefined, "numer").text("decimals");
        }
      } else {
        result[i] = nerdamer(result[i], undefined, "numer").text("decimals");
      }
    }
    return result;
  } else if (typeof result === "object" && "text" in result) { //an expression result
    return result.text("decimals");
  } else { // a string result
    console.log("converting a string result to decimals");
    return result;
  }
}

//find matching parenthesis within a given string from the start index
let findMatchingParen = function(string, start) {
  let stack = [];
  for (let i = start; i < string.length; i++) {
    let current = string.charAt(i);
    if (current === "(") {
      stack.push(1);
    } else if (current === ")") {
      stack.pop();
    }
    if (stack.length === 0) {
      return i;
    }
  }
  return -1;
}

// source: https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
function clone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}
