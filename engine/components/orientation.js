/**
 * This component handles the orientation of an entity. It maintains an `orientationMatrix` property on the owner to describe the entity's orientation using an affine transformation matrix.
 * 
 * Several methods on this component accept either a 3x3 2D Array or a string to describe orientation changes. Accepted strings include:
 *  - "horizontal"       - This flips the entity around the y-axis.
 *  - "vertical"         - This flips the entity around the x-axis.
 *  - "diagonal"         - This flips the entity around the x=y axis.
 *  - "diagonal-inverse" - This flips the entity around the x=-y axis.
 *  - "rotate-90"        - This rotates the entity 90 degrees clockwise.
 *  - "rotate-180"       - This rotates the entity 180 degrees clockwise (noticeable when tweening).
 *  - "rotate-270"       - This rotates the entity 90 degrees counter-clockwise. 
 * 
 * NOTE: This component absorbs specific properties already on the entity into orientation:
 *  - **orientationMatrix**: 3x3 2D array describing an affine transformation.
 *  - If the above is not provided, these properties are used to set initial orientation. This is useful when importing Tiled maps.
 *     - **scaleX**: absorb -1 if described
 *     - **scaleY**: absorb -1 if described
 *     - **rotation**: absorb 90 degree rotations
 * 
 * @class "orientation" Component
 * @uses Component
 */
(function () {
	"use strict";
	
	var matrices = {
		'horizontal':              [[-1, 0, 0],
			                        [ 0, 1, 0],
			                        [ 0, 0,-1]],
	    'vertical':                [[ 1, 0, 0],
			                        [ 0,-1, 0],
			                        [ 0, 0,-1]],
		'diagonal':                [[ 0, 1, 0],
			                        [ 1, 0, 0],
			                        [ 0, 0,-1]],
		'diagonal-inverse':        [[ 0,-1, 0],
			                        [-1, 0, 0],
			                        [ 0, 0,-1]],
		'rotate-90':               [[ 0,-1, 0],
			                        [ 1, 0, 0],
			                        [ 0, 0, 1]],
		'rotate-180':              [[-1, 0, 0],
			                        [ 0,-1, 0],
			                        [ 0, 0, 1]],
		'rotate-270':              [[ 0, 1, 0],
			                        [-1, 0, 0],
			                        [ 0, 0, 1]]
	},
	multiply = (function () {
		var cell = function (row, column, m) {
			var i = 0,
			sum = 0;
			
			for(i = 0; i < row.length; i++) {
				sum += row[i] * m[i][column];
			}
			
			return sum;
		};
		
		return function (a, b, dest) {
			var i  = 0,
			j      = 0,
			arr    = [];
			
			for(i = 0; i < a.length; i++) {
				for(j = 0; j < a[0].length; j++) {
					arr.push(cell(a[i], j, b)); 
				}
			}

			for(i = 0; i < a.length; i++) {
				for(j = 0; j < a[0].length; j++) {
					dest[i][j] = arr.splice(0,1)[0]; 
				}
			}
		};
	}()),
	identitize = function (m) {
		var i = 0,
		j     = 0;
		
		for (i = 0; i < 3; i++) {
			for (j = 0; j < 3; j++) {
				if (i === j) {
					m[i][j] = 1;
				} else {
					m[i][j] = 0;
				}
			}
		}
		
		return m;
	};
	
	return platformer.createComponentClass({
		id: 'orientation', 
		publicProperties:{
			/**
			 * The Entity's scale along the X-axis will mirror the entity's initial orientation if it is negative. This value is available via `entity.scaleX`, but is not manipulated by this component after instantiation.
			 * 
			 * @property scaleX
			 * @type number
			 * @default 1
			 */
			"scaleX": 1,

			/**
			 * The Entity's scale along the Y-axis will flip the entity's initial orientation if it is negative. This value is available via `entity.scaleY`, but is not manipulated by this component after instantiation.
			 * 
			 * @property scaleY
			 * @type number
			 * @default 1
			 */
			"scaleY": 1,

			/**
			 * The Entity's rotation will rotate entity's initial orientation if it is a multiple of 90 degrees. This value is available via `entity.rotation`, but is not manipulated by this component after instantiation.
			 * 
			 * @property rotation
			 * @type number
			 * @default 0
			 */
			"rotation": 0,

			/**
			 * The Entity's orientation is an angle in radians describing an entity's orientation around the Z-axis. This property is affected by a changing `entity.orientationMatrix` but does not itself change the orientation matrix.
			 * 
			 * @property orientation
			 * @type number
			 * @default 0
			 */
			"orientation": 0,
			
			/**
			 * The entity's orientation matrix determines the orientation of an entity and its vectors. It's a 3x3 2D Array describing an affine transformation of the entity.
			 * 
			 * @property orientationMatrix
			 * @type Array
			 * @default 3x3 identity matrix
			 */
			"orientationMatrix": null
		},
		constructor: (function () {
			var setupOrientation = function (self, orientation) {
				var normal = new platformer.Vector([0, 0, 1]),
				origin     = new platformer.Vector([1, 0, 0]),
				vector     = new platformer.Vector([1, 0, 0]),
				owner      = self.owner,
				matrix     = [[1, 0, 0],
				              [0, 1, 0],
				              [0, 0, 1]];
				
				Object.defineProperty(owner, 'orientationMatrix', {
					get: function () {
						multiply(self.matrixTween, self.matrix, identitize(matrix));
						return matrix;
					},
					enumerable: true
				});

				delete owner.orientation;
				Object.defineProperty(owner, 'orientation', {
				    get: function () {
				        return vector.signedAngleTo(origin, normal);
				    },
				    set: function (value) {
				    	vector.set(origin).rotate(value);
				    },
				    enumerable: true
				});

				if (orientation) {
					vector.rotate(orientation);
				}

				return vector;
			};
			
			return function (definition) {
				this.loadedOrientationMatrix = this.orientationMatrix;
				
				// This is the stationary transform
				this.matrix   = [[1,0,0],[0,1,0],[0,0,1]];
				
				// This is the tweening transform
				this.matrixTween = [[1,0,0],[0,1,0],[0,0,1]];
				
				this.vectors  = [];
				this.inverses = [];
				this.tweens   = [];
				
				this.owner.triggerEvent('orient-vector', setupOrientation(this, this.orientation));
			};
		}()),

		events: {
			/**
			 * This component listens for this event prior to loading initial transformations.
			 * 
			 * @method 'load'
			 */
			"load": function () {
				if (this.loadedOrientationMatrix) {
					this.transform(this.loadedOrientationMatrix);
				} else {
					if (this.scaleX && this.scaleX < 0) {
						this.scaleX = -this.scaleX;
						this.transform('horizontal');
					}
					if (this.scaleY && this.scaleY < 0) {
						this.scaleY = -this.scaleY;
						this.transform('vertical');
					}
					if (this.rotation) {
						if (!((this.rotation + 270) % 360)) {
							this.rotation = 0;
							this.transform('rotate-90');
						} else if (!((this.rotation + 180) % 360)) {
							this.rotation = 0;
							this.transform('rotate-180');
						} else if (!((this.rotation + 90) % 360)) {
							this.rotation = 0;
							this.transform('rotate-270');
						}
					}
				}
				delete this.loadedOrientationMatrix;
			},
			
			/**
			 * On the 'handle-logic' event, this component updates any transformational tweening of the entity.
			 * 
			 * @method 'handle-logic'
			 * @param tick.delta {number} Time passed since the last logic step.
			 */
			"handle-logic": function (tick) {
				var i = 0,
				delta = tick.delta,
				state = this.owner.state,
				finishedTweening = [];
				
				if (this.tweens.length) {
					state.reorienting = true;
					identitize(this.matrixTween);
					
					for(i = this.tweens.length - 1; i >= 0; i--) {
						if (this.updateTween(this.tweens[i], delta)) { // finished tweening
							finishedTweening.push(this.tweens.splice(i,1)[0]);
						}
					}
					for(i = 0; i < this.vectors.length; i++) {
						this.updateVector(this.vectors[i], this.inverses[i]);
					}
					for(i = 0; i < finishedTweening.length; i++) {
						this.transform(finishedTweening[i].endMatrix);
						finishedTweening[i].onFinished(finishedTweening[i].endMatrix);
					}
				} else if (state.reorienting) {
					identitize(this.matrixTween);
					state.reorienting = false;
				}
			},
			
			/**
			 * On receiving this message, any currently running orientation tweens are discarded, returning the entity to its last stable position.
			 * 
			 * @method 'drop-tweens'
			 */
			"drop-tweens": function () {
				this.tweens.length = 0;
				for(var i = 0; i < this.vectors.length; i++) {
					this.updateVector(this.vectors[i], this.inverses[i]);
				}
			},
			
			/**
			 * On receiving a vector via this event, the component will transform the vector using the current orientation matrix and then store the vector and continue manipulating it as the orientation matrix changes.
			 * 
			 * @method 'orient-vector'
			 * @param vector {Vector} The vector whose orientation will be maintained.
			 */
			"orient-vector": function (vector) {
				var i = 0,
				found = false,
				aligned = vector.aligned || false;
				
				if (vector.vector) {
					vector = vector.vector;
				}
				
				for(i = 0; i < this.vectors.length; i++) {
					if (vector === this.vectors[i]) {
						found = true;
						break;
					}
				}
				
				if (!found) {
					if (!aligned) {
						vector.multiply(this.matrix);
					}
					this.vectors.push(vector);
					this.inverses.push(new platformer.Vector());
				}
			},
			
			/**
			 * On receiving this message, the maintained vector is immediately dropped from the list of maintained vectors.
			 * 
			 * @method 'remove-vector'
			 * @param vector {Vector} The vector to be removed.
			 */
			"remove-vector": function (vector) {
				var i = 0;
				
				for(i = 0; i < this.vectors.length; i++) {
					if (vector === this.vectors[i]) {
						this.vectors.splice(i,1);
						this.inverses.splice(i,1);
						break;
					}
				}
			},
			
			/**
			 * This message causes the component to begin tweening the entity's orientation over a span of time into the new orientation.
			 * 
			 * @method 'tween-transform'
			 * @param options {Object} A list of key/value pairs describing the tween options.
			 * @param options.matrix {Array} A transformation matrix: only required if `transform` is not provided
			 * @param options.transform {String} A transformation type: only required if `matrix` is not provided.
			 * @param options.time {number} The time over which the tween occurs. 0 makes it instantaneous.
			 * @param [options.angle] {number} Angle in radians to transform. This is only valid for rotations and is derived from the transform if not provided.
			 * @param [options.tween] {Function} A function describing the transition. Performs a linear transition by default. See CreateJS Ease for other options.
			 * @param [options.onTick] {Function} A function that should be processed on each tick as the tween occurs.
			 * @param [options.onFinished] {Function} A function that should be run once the transition is complete.
			 */			
			"tween-transform": (function () {
				var doNothing = function () {
					// Doing nothing!
				},
				linearEase = function (t) {
					return t;
				};

				return function (props) {
					var angle = props.angle || 0,
					matrix    = props.matrix;
					
					if (!matrix) {
						matrix = matrices[props.transform];
					}
					
					if (!angle && (props.transform.indexOf('rotate') === 0)) {
						switch(props.transform) {
						case 'rotate-90':  angle = Math.PI / 2;  break;
						case 'rotate-180': angle = Math.PI;      break;
						case 'rotate-270': angle = -Math.PI / 2; break;
						default: 
							angle = (props.transform.split('-')[1] / 180) * Math.PI;
							break;
						}
					}
					
					this.tweens.push({
						transform: props.transform,
						endTime: props.time || 0,
						time: 0,
						endMatrix: matrix,
						angle: angle,
						tween: props.tween || linearEase,
						onFinished: props.onFinished || doNothing,
						onTick: props.onTick || doNothing
					});
				};
			}()),
			
			/**
			 * This message performs an immediate transform of the entity by performing the transformation via a prepended matrix multiplication.
			 * 
			 * @method 'transform'
			 * @param transform {Array|String} A 3x3 @D Array or a string describing a transformation.
			 */
			"transform": function (transform) {
				this.transform(transform);
			},
			
			/**
			 * This message performs an immediate transform of the entity by performing the transformation via a prepended matrix multiplication.
			 * 
			 * @method 'prepend-transform'
			 * @param transform {Array|String} A 3x3 @D Array or a string describing a transformation.
			 */
			"prepend-transform": function (transform) {
				this.transform(transform);
			},
			
			/**
			 * This message performs an immediate transform of the entity by performing the transformation via an appended matrix multiplication.
			 * 
			 * @method 'append-transform'
			 * @param transform {Array|String} A 3x3 @D Array or a string describing a transformation.
			 */
			"append-transform": function (transform) {
				this.transform(transform, true);
			},
			
			/**
			 * This message performs an immediate transform of the entity by returning the entity to an identity transform before performing a matrix multiplication.
			 * 
			 * @method 'replace-transform'
			 * @param transform {Array|String} A 3x3 @D Array or a string describing a transformation.
			 */
			"replace-transform": function (transform) {
				this.replace(transform);
			}
		},
		
		methods: {
			transform: function (transform, append) {
				if (Array.isArray(transform)) {
					this.multiply(transform, append);
				} else if (typeof transform === 'string') {
					if (matrices[transform]) {
						this.multiply(matrices[transform], append);
					}
				}
			},
			
			multiply: (function () {
				return function (m, append) {
					var i = 0;
					
					if (append) {
						multiply(this.matrix, m, this.matrix);
					} else {
						multiply(m, this.matrix, this.matrix);
					}
					
					for(i = 0; i < this.vectors.length; i++) {
						this.vectors[i].multiply(m);
						this.inverses[i].multiply(m);
					}
					
					/**
					 * Once a transform is complete, this event is triggered to notify the entity of the completed transformation.
					 * 
					 * @event 'orientation-updated'
					 * @param matrix {Array} A 3x3 2D array describing the change in orientation.
					 */
					this.owner.triggerEvent('orientation-updated', m);
				};
			}()),

			replace: (function () {
				var det2 = function (a, b, c, d) {
					return a * d - b * c;
				},
				det3 = function (a) {
					var i  = 0,
					sum    = 0;
					
					for(i = 0; i < 3; i++) {
						sum += a[i][0] * a[(i + 1) % 3][1] * a[(i + 2) % 3][2];
						sum -= a[i][2] * a[(i + 1) % 3][1] * a[(i + 2) % 3][0];
					}
					return sum;
				},
				invert = function (a) {
					var arr    = [[],[],[]],
					inv        = 1 / det3(a);
					
					arr[0].push(det2(a[1][1], a[1][2], a[2][1], a[2][2]) * inv);
					arr[0].push(det2(a[0][2], a[0][1], a[2][2], a[2][1]) * inv);
					arr[0].push(det2(a[0][1], a[0][2], a[1][1], a[1][2]) * inv);
					arr[1].push(det2(a[1][2], a[1][0], a[2][2], a[2][0]) * inv);
					arr[1].push(det2(a[0][0], a[0][2], a[2][0], a[2][2]) * inv);
					arr[1].push(det2(a[0][2], a[0][0], a[1][2], a[1][0]) * inv);
					arr[2].push(det2(a[1][0], a[1][1], a[2][0], a[2][1]) * inv);
					arr[2].push(det2(a[0][1], a[0][0], a[2][1], a[2][0]) * inv);
					arr[2].push(det2(a[0][0], a[0][1], a[1][0], a[1][1]) * inv);
					
					return arr;
				};
				
				return function (m) {
					// We invert the matrix so we can re-orient all vectors for the incoming replacement matrix.
					this.multiply(invert(this.matrix));
					this.multiply(m);
				};
			}()),
			
			updateTween: (function () {
				var getMid = function (a, b, t) {
					return (a * (1 - t) + b * t);
				};
				
				return function (tween, delta) {
					var t = 0,
					a = 1,				//  a c -
					b = 0,				//  b d -
					c = 0,				//  - - z
					d = 1,
					z = 1,
					angle = 0,
					m = tween.endMatrix,
					matrix = null;
					
					tween.time += delta;
					
					if (tween.time >= tween.endTime) {
						return true;
					}
					
					t = tween.tween(tween.time / tween.endTime);
					
					if (tween.angle) {
						angle = t * tween.angle;
						a = d = Math.cos(angle);
						b = Math.sin(angle);
						c = -b;
					} else {
						a = getMid(a, m[0][0], t);
						b = getMid(b, m[1][0], t);
						c = getMid(c, m[0][1], t);
						d = getMid(d, m[1][1], t);
						z = getMid(z, m[2][2], t);
					}
					
					matrix = [[a, c, 0], [b, d, 0], [0, 0, z]];

					multiply(matrix, this.matrixTween, this.matrixTween);

					tween.onTick(t, matrix);
				};
			}()),
			
			updateVector: function (vector, inverse) {
				inverse.set(vector.add(inverse));
				vector.multiply(this.matrixTween);
				inverse.subtractVector(vector);
			},
			
			destroy: function () {
				
			}
		},
		
		publicMethods: {
			
		}
	});
}());
