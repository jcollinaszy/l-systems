let systemSize, minmax, stack, coords, currentAngle, axiom, rules, angle, iteration, startingAngle;		// helper variables
let defaultLength = 10;																					// scaling helper variable
let padding = 15;																						// padding for image centering
let timeouts = [];																						// animation helper variable
let roundTo = 4;																						// parameter rounding

// list of presets
let presets = {
	"Koch Snowflake": {angle: 60, startingAngle: 0, axiom: "F--F--F", rules: "F -> F+F--F+F", iteration: 3},
	"Sierpinski Triangle": {angle: 60, startingAngle: 0, axiom: "X", rules: "X -> ++FXF++FXF++FXF\nF -> FF", iteration: 5},
	"Koch Island": {angle: 90, startingAngle: 0, axiom: "F-F-F-F", rules: "F -> F-F+F+FF-F-F+F", iteration: 2},
	"Gosper Curve": {angle: 60, startingAngle: 0, axiom: "F", rules: "F -> F+G++G-F--FF-G+\nG -> -F+GG++G+F--F-G", iteration: 3},
	"Hilbert Curve": {angle: 90, startingAngle: 0, axiom: "X", rules: "X -> -YF+XFX+FY-\nY -> +XF-YFY-FX+", iteration: 5},
	
	"Peano Curve": {angle: 90, startingAngle: 0, axiom: "X", rules: "X -> XFYFX+F+YFXFY-F-XFYFX\nY -> YFXFY-F-XFYFX+F+YFXFY", iteration: 3},
	"Dragon Curve": {angle: 90, startingAngle: 0, axiom: "FX", rules: "X -> X+YF+\nY -> -FX-Y", iteration: 11},
	"Krishna Anklets": {angle: 45, startingAngle: 0, axiom: "-X--X", rules: "X -> XFX--XFX", iteration: 4},
	"Koch Curve": {angle: 90, startingAngle: 0, axiom: "F", rules: "F -> F+F-F-F+F", iteration: 4},
	"Islands and Lakes": {angle: 90, startingAngle: 0, axiom: "F+F+F+F", rules: "F -> F+f-FF+F+FF+Ff+FF-f+FF-F-FF-Ff-FFF\nf -> ffffff", iteration: 2},
	
	"Plant 1": {angle: 25.7, startingAngle: -90, axiom: "F", rules: "F -> F[+F]F[-F]F", iteration: 3},
	"Plant 2": {angle: 20, startingAngle: -90, axiom: "X", rules: "X -> F[+X]F[-X]+X\nF -> FF", iteration: 4},
	"Plant 3": {angle: 25.7, startingAngle: -90, axiom: "X", rules: "X -> F[+X][-X]FX\nF -> FF", iteration: 4},
	"Plant 4": {angle: 22.5, startingAngle: -90, axiom: "X", rules: "X -> F-[[X]+X]+F[+FX]-X\nF -> FF", iteration: 4},
	"Plant 5": {angle: 25.7, startingAngle: -90, axiom: "Y", rules: "Y -> YFX[+Y][-Y]\nX -> X[-FFF][+FFF]FX", iteration: 4},
	
	"Stochastic Plant 1": {angle: 30, startingAngle: -90, axiom: "F", rules: "F -> (0.33)F[+F]F[-F]F\nF -> (0.33)F[+F]F\nF -> (0.34)F[-F]F", iteration: 4},
	"Stochastic Plant 2": {angle: 10, startingAngle: -90, axiom: "Fb", rules: "b -> (0.334)[+Fb][-Fb]\nb -> (0.333)[++Fb][--Fb]\nb -> (0.333)[+++Fb][---Fb]", iteration: 5},
	"Random Koch Curve": {angle: 60, startingAngle: 0, axiom: "F", rules: "F -> (0.5)F-F++F-F\nF -> (0.5)F+F--F+F", iteration: 4},
	"Signal Propagation": {angle: 45, startingAngle: -90, axiom: "E[+F]F[-F]F[+F]F[-F]F", rules: "ignore + -\n\nE<F -> E", iteration: 0},
	"Row of Trees": {angle: 86, startingAngle: 0, axiom: "F(1)", rules: "define p 0.3\ndefine q 0.7\ndefine h 0.458\n\nF(x) -> F(x*p)+F(x*h)--F(x*h)+F(x*q)", iteration: 3},
};

// load preset
let loadPreset = function(preset) {
	preset = presets[preset];
	$( "#angle" ).val(preset.angle);
	$( "#startingAngle" ).val(preset.startingAngle);
	$( "#axiom" ).val(preset.axiom);
	$( "#rules" ).val(preset.rules);
	$( "#iteration" ).val(preset.iteration);
}

// context sensitive grammar helper function
let contextCheck = function(ignore, context, iter, axiom, tempSet) {
	let offset = 0;
	for ( let c = 0; c < axiom.length; c++ ) {
		if ( axiom[c] in ignore ) {
			axiom[c] = "";
			if ( c < iter ) {
				offset++;
			}
		}
	}
	iter -= offset;
	axiom = axiom.join("");
	
	// prefix
	let tempVar = [];
	context[0] = context[0].split("");
	for ( let c = 0; c < context[0].length; c++ ) {
		if ( context[0][c] == "(" ) {
			let bra = "";
			while ( ++c < context[0].length && context[0][c] != ")" ) {
				bra += context[0][c];
				if ( context[0][c] != "," ) {
					context[0][c] = "";
				}
			}
			tempVar = tempVar.concat( bra.split(",") );
		}
	}
	context[0] = context[0].join("");
	
	let argVar = [];
	let buIter = iter;
	if ( context[0] != "" ) {
		let prefix = "";
		while ( --iter >= 0 && prefix.length < context[0].length) {
			if ( axiom.charAt(iter) == "[" ) {
				continue;
			} else if ( axiom.charAt(iter) == "]" ) {
				let nBracs = 1;
				while ( nBracs != 0 && iter != 0) {
					iter --; 
					if ( axiom.charAt(iter) == "]" ) {
						nBracs++;
					} else if ( axiom.charAt(iter) == "[" ) {
						nBracs--;
					}
				}
			} else if ( axiom.charAt(iter) == ")" ) {
				let arg = "";
				prefix = axiom.charAt(iter) + prefix;
				while ( --iter != 0 && axiom.charAt(iter) != "(" ) {
					arg += axiom.charAt(iter);
					if ( axiom.charAt(iter) == "," ) {
						prefix = axiom.charAt(iter) + prefix;
					}
				}
				argVar = argVar.concat( arg.split(",") );
				prefix = axiom.charAt(iter) + prefix;
			} else {
				prefix = axiom.charAt(iter) + prefix;
			}
		}

		if ( prefix != context[0] ) {
			return false;
		} 
	} 
	
	// suffix
	let tempVar2 = [];
	context[1] = context[1].split("");
	for ( let c = 0; c < context[1].length; c++ ) {
		if ( context[1][c] == "(" ) {
			let bra = "";
			while ( ++c < context[1].length && context[1][c] != ")" ) {
				bra += context[1][c];
				if ( context[1][c] != "," ) {
					context[1][c] = "";
				}
			}
			tempVar2 = tempVar2.concat( bra.split(",") );
		}
	}
	context[1] = context[1].join("");

	let argVar2 = [];
	iter = buIter;
	if ( context[1] != "" ) {
		if ( iter + 1 < axiom.length && axiom.charAt(iter +1) == "(" ) {
			while ( axiom.charAt(iter) != ")" ) {
				iter++;
			}
			if ( iter + 1 == axiom.length ) {
				return false;
			}
		}
		let p = 0;
		let bracs = 0;
		let bu = 0;
		while ( ++iter < axiom.length && p < context[1].length ) {
			if ( axiom.charAt(iter) == context[1].charAt(p) ) {
				p++;
				if ( bracs > 0 ) {
					bu++;
				}
				if ( axiom.charAt(iter) == "(" || axiom.charAt(iter) == "," ) {
					let numb = "";
					while ( axiom.charAt(++iter) != "," && axiom.charAt(iter) != ")" ) {
						numb += axiom.charAt(iter);
					}
					argVar2.push([numb, bracs]);
					iter--;
				}
			} else if ( axiom.charAt(iter) == "[" ) {
				bracs++;
			} else {
				if ( bracs > 0 ) {
					while ( iter < axiom.length && axiom.charAt(iter) != "]") {
						iter++;
					}
					p -= bu;
					bu = 0;
					for ( let a = 0; a < argVar2.length; a++ ) {
						if ( argVar2[a][1] == bracs ) {
							argVar2.splice(a);
							break;
						}
					}
					bracs--;
				} else {
					return false;
				}
			}
		}

		if ( p != context[1].length ) {
			return false;
		}
	}
	
	for ( let a = 0; a < argVar.length; a++ ) {
		if ( tempVar[tempVar.length - a - 1] in tempSet && tempSet[tempVar[tempVar.length - a - 1]] != argVar[a] ) {
			return false;
		}			
		tempSet[tempVar[tempVar.length - a - 1]] = argVar[a];
	}
	for ( let a = 0; a < argVar2.length; a++ ) {
		if ( tempVar2[tempVar2.length - a - 1] in tempSet && tempSet[tempVar2[tempVar2.length - a - 1]] != argVar2[a][0] ) {
			return false;
		}			
		tempSet[tempVar2[tempVar2.length - a - 1]] = argVar2[a][0];
	}
	return true;
}	

// parametric grammar helper function
let parameterCheck = function(condi, vars, values) {
	condi = condi.split("");
	for ( let c = 0; c < condi.length; c++ ) {
		for ( let v = 0; v < vars.length; v++ ) {
			if ( condi[c] == vars[v] ) {
				condi[c] = values[v];
			}
		}
	}
	condi = condi.join("");
	if (!(eval(condi))) {
		return false;
	}
	return true;
}

// TODO : optimize, add errors for invalid systems
// generate string for desired iteration
let getIteration = function(axiom, rules, iteration) {
	rules = rules.split("\n");
	let ruleSet = {}; 							// set of rules 
	let varSet = {};							// set of variables for parametric grammars
	let tempSet = {};							// set of temporary variables for parametric grammars
	let ignore = {};							// symbol ignore list for context sensitive grammars
	let parametric = false;						// parametric switch
	let brackets = 0;							// stochastic/parametric helper
	
	
	// create rule set
	for ( let i = 0; i < rules.length; i++ ) {
		if ( rules[i] != "" ) {
			if ( rules[i].indexOf("->") == -1 ) {
				let rule = rules[i].trim().split(" ");
				if ( rule[0].toLowerCase() == "define" && rule.length == 3) {
					// parametric - parameter definitions
					if ( isNaN(rule[2]) ) {
						rule[2] = rule[2].split("");
						for ( let r = 0; r < rule[2].length; r++ ) {
							if ( rule[2][r] in varSet ) {
								rule[2][r] = varSet[rule[2][r]];
							}
						}
						rule[2] = eval(rule[2].join(""));
					}
					varSet[rule[1]] = rule[2];
				} else if ( rule[0].toLowerCase() == "ignore" ) {
					// context sensitive ignore list
					for ( let r = 1; r < rule.length; r ++ ) {
						ignore[rule[r]] = 0;
					}
				}
			} else {
				let temp = rules[i].split("->");
				let left = temp[0].replace(/ /g,'');	// left side of rule
				let right = temp[1].replace(/ /g,'');	// right side  of rule
				let chance = 1;							// stochastic helper - percentage for applying rule
				let context = ["", ""];					// context sensitive grammars [left, right] constraint
				let param = "";							// parameter
				let condi = "";							// condition for parametric l systems
				
				//parametric - conditions
				if ( left.indexOf(':') != -1 ) {
					left = left.split(":");
					condi = left[1];
					left = left[0];
					condi = condi.split("");
					for ( let c = 0; c < condi.length; c++ ) {
						if ( condi[c] in varSet ) {
							condi[c] = varSet[condi[c]];
						}
					}
					condi = condi.join("");
				}
				
				// context sensitive
				if ( left.indexOf('>') > -1 ) {
					context[1] = left.substr(left.indexOf(">") + 1);
					left = left.substr(0, left.indexOf(">"));
				}
				if ( left.indexOf('<') > -1 ) {
					context[0] = left.substr(0, left.indexOf("<"));
					left = left.substr(left.indexOf("<") + 1);
				}

				// parametric - brackets
				if ( left.indexOf('(') != -1 ) {
					parametric = true;
					brackets = left.indexOf('(');
					while (left.charAt(++brackets) != ")") {
						param += left.charAt(brackets);
					}
					param = param.split(",");
					left = left.substr( 0, left.indexOf('(') );
				}

				// stochastic
				if ( right.charAt(0) == "(" ) {
					chance = "";
					brackets = 0;
					while (right.charAt(++brackets) != ")") {
						chance += right.charAt(brackets);
					}
					right = right.substr(++brackets);
				}
				
				if ( left in ruleSet ) {
					ruleSet[left].push([chance, right, context, param, condi]);
				} else {
					ruleSet[left] = [[chance, right, context, param, condi]];
				}
			}
			
		}
	}
	
	// iterate towards desired level
	for ( let i = 0; i < iteration; i++ ) {
		axiom = axiom.split("");
		let current = axiom.slice();					// original string
		let origIter = 0;								// original iterator
		let origIter2 = 0;
		for ( let j = 0; j < axiom.length; j++ ) {	
			// parametric
			let o = j;
			origIter += origIter2 + 1;
			origIter2 = 0;
			let inside = "";							// parameter in axiom
			if ( j + 1 < axiom.length && axiom[j+1] == "(" ) {
				origIter2++;
				parametric = true;
				brackets = j + 1;
				while (axiom[++brackets] != ")") {
					if ( axiom[brackets] in varSet ) {
						axiom[brackets] = varSet[axiom[brackets]];
					}
					origIter2++;
					inside += axiom[brackets];
				}
				origIter2++;
				axiom.splice(j + 1, brackets - j);
				if ( inside.indexOf(",") != -1 ) {
					inside = inside.split(",");
					for ( let ins = 0; ins < inside.length; ins ++ ) {
						inside[ins] = eval(inside[ins]).toFixed(4);
					}
				} else {
					inside = [eval(inside).toFixed(4)];
				}
			}

			if ( axiom[o] in ruleSet ) {
				tempSet = {};
				let rule = ruleSet[axiom[o]].slice();																							// current rule 
				rule = rule.filter(r => ( r[3].length == inside.length && (r[4] == "" || parameterCheck(r[4], r[3], inside)) ) ); 				// parametric filter
				rule = rule.filter(r => ( r[2][0] == "" && r[2][1] == "" ) || contextCheck(ignore, r[2].slice(), origIter - 1, current.slice(), tempSet));	// context filter
				
				if ( rule.length > 0 ) {
					axiom[o] = rule[0][1];
					for ( let t = 0; t < rule[0][3].length; t++ ) {
						tempSet[rule[0][3][t]] = inside[t];
					}
					
					if ( rule[0][0] != 1 ) {
						//stochastic
						for ( let m = 0; m < rule.length; m++ ) {
							if ( isNaN(rule[m][0]) ) {
								rule[m][0] = rule[m][0].split("");
								for ( let ch = 0; ch < rule[m][0].length; ch ++ ) {
									if ( rule[m][0][ch] in varSet ) {
										rule[m][0][ch] = varSet[rule[m][0][ch]];
									}
									if ( rule[m][0][ch] in tempSet ) {
										rule[m][0][ch] = tempSet[rule[m][0][ch]];
									}
								}
								rule[m][0] = eval(rule[m][0].join(""));
							}
						}
						
						let rand = Math.random();
						let m = 0;

						while ( rand > rule[m][0] ) {
							rand -= rule[m][0];
							m++;
							if ( m == rule.length ) {
								m--;
								break;
							}
						}
						axiom[o] = rule[m][1];
					}
					// parametric
					axiom[o] = axiom[o].split("");
					for ( let ch = 0; ch < axiom[o].length; ch ++ ) {
						if ( axiom[o][ch] in varSet ) {
							axiom[o][ch] = varSet[axiom[o][ch]];
						}
						if ( axiom[o][ch] in tempSet ) {
							axiom[o][ch] = tempSet[axiom[o][ch]];
						}
					}
					axiom[o] = axiom[o].join("");
				} else if ( inside != "" ) {
					axiom[o] = axiom[o] + "(" + inside.join(",") + ")";
				}
			} else if ( inside != "" ) {
				axiom[o] = axiom[o] + "(" + inside.join(",") + ")";
			}
		}
		axiom = axiom.join("");
	}
	
	// evaluate all brackets 
	if ( parametric ) {
		axiom = axiom.split("");
		for ( let j = 0; j < axiom.length; j++ ) {
			if ( axiom[j] == "(" ) {
				brackets = j;
				let inside = "";
				while (axiom[++brackets] != ")") {
					inside += axiom[brackets];
				}
				inside = inside.split(",");
				for ( let ins = 0; ins < inside.length; ins++ ) {
					inside[ins] = (+eval(inside[ins]).toFixed(roundTo)).toString();
				}
				axiom[j] = "(" + inside.join(",") + ")";
				axiom.splice(j +  1, brackets - j);
			}
		}
		axiom = axiom.join("");
	}
	
	return axiom;
};

// event handlers
$( document ).ready(function() {
	$( "#generate, #animate" ).click(function(e) {
		e.preventDefault();
		angle = parseFloat($( "#angle" ).val());
		startingAngle = parseFloat($( "#startingAngle" ).val());
		axiom = $( "#axiom" ).val();
		rules = $( "#rules" ).val();
		iteration = parseInt($( "#iteration" ).val(), 10);
		let lsys = getIteration(axiom, rules, iteration);
		$( "#output" ).val(lsys);
		if (this.id=="animate") {
			draw(lsys, true);
		} else {
			draw(lsys);
		}
	});

	$('.preset').on("click", function(e) {
		loadPreset($(this).attr('name'));
		$( "#generate" ).click();
	});
	
	$( ".fa-plus-circle" ).click(function(e) {
		$( "#iteration" ).val(parseInt($( "#iteration" ).val(), 10) + 1);
		$( "#generate" ).click();
	});
	
	$( ".fa-minus-circle" ).click(function(e) {
		if (parseInt($( "#iteration" ).val(), 10) > 0) {
			$( "#iteration" ).val(parseInt($( "#iteration" ).val(), 10) - 1);
			$( "#generate" ).click();
		}
	});
	
	loadPreset("Koch Snowflake");
	$( "#generate" ).click();
	
	// initialize tooltips
	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	})
});

// TODO : optimize
// draw system
let draw = function(lsys, animate=false) {
	minmax = [0,0,0,0];
	systemSize = 0;
	stack = [];
	let canvas = document.getElementById('canvas');
	
	// clean up after animations
	for ( let i = 0; i < timeouts.length; i++ ) {
		clearTimeout(timeouts[i]);
	}
	timeouts = [];
	
	if (canvas.getContext) {
		let ctx = canvas.getContext('2d');

		// draw background
		ctx.fillStyle = "#2f3136";
		ctx.lineWidth = 1;
		ctx.fillRect (0, 0, canvas.width, canvas.height);
		
		// calculate sizes for centering
		coords = [0, 0];
		currentAngle = startingAngle;
		for ( let i = 0; i < lsys.length; i++ ) {
			let o = i;
			let param = "";
			if ( i + 1 < lsys.length && lsys.charAt(i+1) == "(" ) {
				let brackets = i + 1;
				while (lsys.charAt(++brackets) != ")") {
					param += lsys.charAt(brackets);
				}
				i = brackets; 
			}
			drawHelper(lsys.charAt(o), param, ctx, 2);
		}
		
		if ( systemSize == 0 ) return;
		
		let sizes = [minmax[2]-minmax[0], minmax[3]-minmax[1]];			// size of l-system
		let cWidth = canvas.width - padding * 2;						// accessible canvas width
		let cHeight = canvas.height - padding * 2;						// accessible canvas height
		let ratio = Math.min(cWidth / sizes[0], cHeight / sizes[1]);	// scaling ratio
		
		// scale default line length and starting point
		defaultLength =  ratio * defaultLength;
		coords = [(Math.abs(minmax[0]) * ratio) - (((ratio * sizes[0]) - cWidth) / 2) + padding, (Math.abs(minmax[1]) * ratio) - (((ratio * sizes[1]) - cHeight) / 2) + padding];
		
		stack = [];
		currentAngle = startingAngle;
		
		// draw system
		ctx.beginPath();
		ctx.moveTo(coords[0], coords[1]);
		
		// draw one command at a time
		if (animate) {
			for ( let i = 0; i < lsys.length; i++ ) {
				timeouts.push(setTimeout(function() {
					let o = i;
					let param = "";
					if ( i + 1 < lsys.length && lsys.charAt(i+1) == "(" ) {
						let brackets = i + 1;
						while (lsys.charAt(++brackets) != ")") {
							param += lsys.charAt(brackets);
						}
						i = brackets; 
					}
					drawHelper(lsys.charAt(o), param, ctx, 1);
				}, i*(1000/systemSize)));
			}
		// draw at the same time
		} else {
			for ( let i = 0; i < lsys.length; i++ ) {
				let o = i;
				let param = "";
				if ( i + 1 < lsys.length && lsys.charAt(i+1) == "(" ) {
					let brackets = i + 1;
					while (lsys.charAt(++brackets) != ")") {
						param += lsys.charAt(brackets);
					}
					i = brackets; 
				}
				drawHelper(lsys.charAt(o), param, ctx, 0);
			}
			ctx.stroke();
		}
	}
}

// mode : 0 - generate, 1 - animate, 2 - calculate scaling ratio
let drawHelper = function(ch, param, ctx, mode) {
	switch (ch) {
		case "E":
		case "F":
		case "G":
		case "f":
		case "g":
			//color
			if ( ch == "E") {
				ctx.strokeStyle = "#f04747";
			} else {
				ctx.strokeStyle = "#28a745";
			}
			
			let ratio = 1;
			if ( param != "" ) {
				ratio = parseFloat(param);
			}
			
			coords = [coords[0] + defaultLength * ratio * Math.cos(Math.PI * currentAngle / 180.0), coords[1] + defaultLength * ratio * Math.sin(Math.PI * currentAngle / 180.0)];
			if ( mode != 2 ) {
				if ( ch == "F" || ch == "G" || ch == "E") {
					ctx.lineTo(coords[0], coords[1]);
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(coords[0], coords[1]);
				} else {
					ctx.moveTo(coords[0], coords[1]);
				}
			} else {
				systemSize += 1;
				if (coords[0] < minmax[0]) {
					minmax[0] = coords[0];
				}
				if (coords[0] > minmax[2]) {
					minmax[2] = coords[0];
				}			
				if (coords[1] < minmax[1]) {
					minmax[1] = coords[1];
				}
				if (coords[1] > minmax[3]) {
					minmax[3] = coords[1];
				}
			}
			break;
		case "+":
			if ( param != "" ) {
				currentAngle -= parseFloat(param);
			} else {
				currentAngle -= angle;
			}
			break;
		case "-":
			if ( param != "" ) {
				currentAngle += parseFloat(param);
			} else {
				currentAngle += angle;
			}
			break;
		case "|":
				currentAngle += 180;
			break;
		case "[":
			stack.push([coords, currentAngle]);
			break;
		case "]":
			let temp = stack.pop(coords);
			coords = temp[0];
			currentAngle = temp[1];
			if ( mode != 2 ) ctx.moveTo(coords[0], coords[1]);
			break;
	};
};