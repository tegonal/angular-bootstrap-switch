'use strict';

angular.module('frapontillo.bootstrap-switch')
  .directive('bsSwitch', function ($parse, $timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function link(scope, element, attrs, controller) {
        var isInit = false;

        /**
         * Return the true value for this specific checkbox.
         * @returns {Object} representing the true view value; if undefined, returns true.
         */
        var getTrueValue = function() {
          if (attrs.type === 'radio') {
            return attrs.value || $parse(attrs.ngValue)(scope) || true;
          }
          var trueValue = ($parse(attrs.ngTrueValue)(scope));
          if (!angular.isString(trueValue)) {
            trueValue = true;
          }
          return trueValue;
        };

        /**
         * Get a boolean value from a boolean-like string, evaluating it on the current scope.
         * @param value The input object
         * @returns {boolean} A boolean value
         */
        var getBooleanFromString = function(value) {
          return scope.$eval(value) === true;
        };

        /**
         * Get a boolean value from a boolean-like string, defaulting to true if undefined.
         * @param value The input object
         * @returns {boolean} A boolean value
         */
        var getBooleanFromStringDefTrue = function(value) {
          return (value === true || value === 'true' || !value);
        };

        /**
         * Returns the value if it is truthy, or undefined.
         *
         * @param value The value to check.
         * @returns the original value if it is truthy, {@link undefined} otherwise.
         */
        var getValueOrUndefined = function (value) {
          return (value ? value : undefined);
        };

        /**
         * Get the value of the angular-bound attribute, given its name.
         * The returned value may or may not equal the attribute value, as it may be transformed by a function.
         *
         * @param attrName  The angular-bound attribute name to get the value for
         * @returns {*}     The attribute value
         */
        var getSwitchAttrValue = function(attrName) {
          var map = {
            'switchRadioOff': getBooleanFromStringDefTrue,
            'switchReadonly': function (value) {
              return !getBooleanFromString(value);
            },
            'switchActive': function(value) {
              return !getBooleanFromStringDefTrue(value);
            },
            'switchAnimate': getBooleanFromStringDefTrue,
            'switchLabel': function(value) {
              return value ? value : '&nbsp;';
            },
            'switchIcon': function(value) {
              if (value) {
                return '<span class=\'' + value + '\'></span>';
              }
            },
            'switchWrapper': function(value) {
              return value || 'wrapper';
            },
            'switchInverse': getBooleanFromString
          };
          var transFn = map[attrName] || getValueOrUndefined;
          return transFn(attrs[attrName]);
        };

        /**
         * Set a bootstrapSwitch parameter according to the angular-bound attribute.
         * The parameter will be changed only if the switch has already been initialized
         * (to avoid creating it before the model is ready).
         *
         * @param element   The switch to apply the parameter modification to
         * @param attr      The name of the switch parameter
         * @param modelAttr The name of the angular-bound parameter
         */
        var setSwitchParamMaybe = function(element, attr, modelAttr) {
          if (!isInit) {
            return;
          }
          var newValue = getSwitchAttrValue(modelAttr);
          element.bootstrapSwitch(attr, newValue);
        };

        var setActive = function() {
          setSwitchParamMaybe(element, 'disabled', 'switchActive');
        };

        /**
         * If the directive has not been initialized yet, do so.
         */
        var initMaybe = function() {
          // if it's the first initialization
          if (!isInit) {
            var viewValue = (controller.$modelValue === getTrueValue());
            isInit = !isInit;
            // Bootstrap the switch plugin
            element.bootstrapSwitch({
              radioAllOff: getSwitchAttrValue('switchRadioOff'),
              readonly: !getSwitchAttrValue('switchReadonly'),
              disabled: getSwitchAttrValue('switchActive'),
              state: viewValue,
              onText: getSwitchAttrValue('switchOnText'),
              offText: getSwitchAttrValue('switchOffText'),
              onColor: getSwitchAttrValue('switchOnColor'),
              offColor: getSwitchAttrValue('switchOffColor'),
              animate: getSwitchAttrValue('switchAnimate'),
              size: getSwitchAttrValue('switchSize'),
              labelText: attrs.switchLabel ? getSwitchAttrValue('switchLabel') : getSwitchAttrValue('switchIcon'),
              wrapperClass: getSwitchAttrValue('switchWrapper'),
              handleWidth: getSwitchAttrValue('switchHandleWidth'),
              labelWidth: getSwitchAttrValue('switchLabelWidth'),
              inverse: getSwitchAttrValue('switchInverse')
            });
            if (attrs.type === 'radio') {
              controller.$setViewValue(controller.$modelValue);
            } else {
              controller.$setViewValue(viewValue);
            }
          }
        };

        /**
         * Listen to model changes.
         */
        var listenToModel = function () {

          attrs.$observe('switchActive', function (newValue) {
            var active = getBooleanFromStringDefTrue(newValue);
            // if we are disabling the switch, delay the deactivation so that the toggle can be switched
            if (!active) {
              $timeout(function() {
                setActive(active);
              });
            } else {
              // if we are enabling the switch, set active right away
              setActive(active);
            }
          });

          function modelValue() {
            return controller.$modelValue;
          }

          // When the model changes
          scope.$watch(modelValue, function(newValue) {
            initMaybe();
            if (newValue !== undefined) {
              element.bootstrapSwitch('state', newValue === getTrueValue(), false);
            }
          }, true);

          // angular attribute to switch property bindings
          var bindings = {
            'switchRadioOff': 'radioAllOff',
            'switchReadonly': 'readonly',
            'switchOnText': 'onText',
            'switchOffText': 'offText',
            'switchOnColor': 'onColor',
            'switchOffColor': 'offColor',
            'switchAnimate': 'animate',
            'switchSize': 'size',
            'switchLabel': 'labelText',
            'switchIcon': 'labelText',
            'switchWrapper': 'wrapperClass',
            'switchHandleWidth': 'handleWidth',
            'switchLabelWidth': 'labelWidth',
            'switchInverse': 'inverse'
          };

          var observeProp = function(prop, bindings) {
            return function() {
              attrs.$observe(prop, function () {
                setSwitchParamMaybe(element, bindings[prop], prop);
              });
            };
          };

          // for every angular-bound attribute, observe it and trigger the appropriate switch function
          for (var prop in bindings) {
            attrs.$observe(prop, observeProp(prop, bindings));
          }
        };

        /**
         * Listen to view changes.
         */
        var listenToView = function () {
          if (attrs.type === 'radio') {
            // when the switch is clicked
            element.on('change.bootstrapSwitch', function (e) {
              // discard not real change events
              if ((controller.$modelValue === controller.$viewValue) && (e.target.checked !== $(e.target).bootstrapSwitch('state'))) {
                // $setViewValue --> $viewValue --> $parsers --> $modelValue
                // if the switch is indeed selected
                if (e.target.checked) {
                  // set its value into the view
                  controller.$setViewValue(getTrueValue());
                } else if (getTrueValue() === controller.$viewValue) {
                  // otherwise if it's been deselected, delete the view value
                  controller.$setViewValue(undefined);
                }
              }
            });
          } else {
            // When the checkbox switch is clicked, set its value into the ngModel
            element.on('switchChange.bootstrapSwitch', function (e) {
              // $setViewValue --> $viewValue --> $parsers --> $modelValue
              controller.$setViewValue(e.target.checked);
            });
          }
        };

        // Listen and respond to view changes
        listenToView();

        // Listen and respond to model changes
        listenToModel();

        // On destroy, collect ya garbage
        scope.$on('$destroy', function () {
          element.bootstrapSwitch('destroy');
        });
      }
    };
  })
  .directive('bsSwitch', function () {
    return {
      restrict: 'E',
      require: 'ngModel',
      template: '<input bs-switch>',
      replace: true
    };
  });
