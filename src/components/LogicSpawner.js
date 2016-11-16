/**
# COMPONENT **LogicSpawner**
This component creates an entity and propels it away. This is useful for casting, firing, tossing, and related behaviors.

## Dependencies:
- [[HandlerLogic]] (on entity's parent) - This component listens for a logic tick message to determine whether it should be spawning or not.

## Messages

### Listens for:
- **handle-logic** - On a `tick` logic message, the component checks its current state to decide whether to spawn entities.
- **spawn** - creates an entity on the following tick message.
  - @param message.pressed (boolean) - Optional. If `message` is included, the component checks the value of `pressed`: false results in no entities being created. Is this primarily for controller input.

## JSON Definition
    {
      "type": "LogicSpawner"
      // List all additional parameters and their possible values here.

      "spawneeClass": "wet-noodle",
      // Required: string identifying the type of entity to create.
      
      "state": "tossing",
      // Optional. The entity state that should be true while entities are being created. Defaults to "firing".
      
      "speed": 4,
      // Optional. The velocity with which the entity should start. Initial direction is determined by this entity's facing states ("top", "right", etc).
      
      "offsetX": 45,
      "offsetY": -20,
      // Optional. Location relative to the entity where the should be located once created. Defaults to (0, 0).
    }
*/
/*global include, platypus */
(function () {
    'use strict';

    var Entity = include('platypus.Entity');

    return platypus.createComponentClass({
        
        id: 'LogicSpawner',
        
        constructor: function (definition) {
            var className = this.owner.spawneeClass || definition.spawneeClass,
                prop = '',
                x = 0;

            this.state = this.owner.state;
            this.stateName = definition.state || 'spawning';
            this.entityClass = platypus.game.settings.entities[className];
            this.speed = definition.speed || this.owner.speed || 0;

            this.state.set(this.stateName, false);
            
            this.spawneeProperties = {
                x: 0,
                y: 0,
                z: 0,
                dx: 0,
                dy: 0,
                spawner: this.owner
            };
            
            if (definition.passOnProperties) {
                for (x = 0; x < definition.passOnProperties.length; x++) {
                    prop = definition.passOnProperties[x];
                    if (this.owner[prop]) {
                        this.spawneeProperties[prop] = this.owner[prop];
                    }
                }
            }
            
            
            this.propertiesContainer = {
                properties: this.spawneeProperties
            };
            
            this.offsetX = this.owner.offsetX || definition.offsetX || 0;
            this.offsetY = this.owner.offsetY || definition.offsetY || 0;
            
            this.firing = false;
        },

        events: {// These are messages that this component listens for
            "handle-logic": function () {
                var offset = 0,
                    classZ = 0,
                    state  = this.state;
                
                if (this.firing) {
                    this.spawneeProperties.x = this.owner.x;
                    this.spawneeProperties.y = this.owner.y;
                    classZ = (this.entityClass.properties && this.entityClass.properties.z) ? this.entityClass.properties.z : 0;
                    this.spawneeProperties.z = this.owner.z + classZ;
                    
                    offset = this.offsetX;
                    if (state.get('left')) {
                        offset *= -1;
                    }
                    this.spawneeProperties.x += offset;
                    
                    offset = this.offsetY;
                    if (state.get('top')) {
                        offset *= -1;
                    }
                    this.spawneeProperties.y += offset;
                    
                    if (this.speed) {
                        if (state.get('top')) {
                            this.spawneeProperties.dy = -this.speed;
                        } else if (state.get('bottom')) {
                            this.spawneeProperties.dy = this.speed;
                        } else {
                            delete this.spawneeProperties.dy;
                        }
                        if (state.get('left')) {
                            this.spawneeProperties.dx = -this.speed;
                        } else if (state.get('right')) {
                            this.spawneeProperties.dx = this.speed;
                        } else {
                            delete this.spawneeProperties.dx;
                        }
                    } else {
                        delete this.spawneeProperties.dx;
                        delete this.spawneeProperties.dy;
                    }
                    
                    if (this.parent) {
                        this.owner.triggerEvent('entity-created', this.parent.addEntity(new Entity(this.entityClass, this.propertiesContainer)));
                    }
                }
                
                state.set(this.stateName, this.firing);

                this.firing = false;
            },
            "spawn": function (value) {
                this.firing = !value || (value.pressed !== false);
                
                this.parent = this.owner.parent; //proofing against this entity being destroyed prior to spawned entity. For example, when a destroyed entity spawns a drop.
            }
        },
        
        methods: {
            destroy: function () {
                this.state = null;
            }
        },
        
        getAssetList: function (def, props, defaultProps) {
            var spawn = def.spawneeClass || props.spawneeClass || defaultProps.spawneeClass;
            
            if (spawn) {
                return Entity.getAssetList({
                    type: spawn
                });
            }
            
            return Array.setUp();
        }
    });
}());
