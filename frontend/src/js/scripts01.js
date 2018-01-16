/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

(function(global) {
  global.utils = {};
})(this);

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var utils = utils || {},
  Window = Window || {};

(function() {
  var addMultipleListeners = function(_element, _eventsArray, _handler, _useCapture, _handlerArgs) {
    var element,
      eventsArray,
      handler,
      handlerArgs = [],
      useCapture,
      errors = {
        element: 'First arguments must be an HTMLElement or Window object',
        eventsArray: 'Second argument must be an array of strings',
        handler: 'Third argument must be a function',
        useCapture: 'Fourth argument must be a boolean value',
        handlerArgs: 'Fifth argument must be an Array of arguments'
      };

      if(_element instanceof HTMLElement || _element instanceof Window) {
        element = _element;
      } else {
        throw new TypeError(errors.element);
      }

      if(_eventsArray instanceof Array) {
        eventsArray = _eventsArray;
      } else {
        throw new TypeError(errors.eventsArray);
      }

      if(_handlerArgs instanceof Array) {
        handlerArgs = _handlerArgs;
      } else if(typeof _handlerArgs !== 'undefined') {
        throw new TypeError(errors.handlerArgs);
      }

      if(_handler instanceof Function) {
        handler = function(e) {
          _handler.apply(this, [e].concat(handlerArgs));
        };
      } else {
        throw new TypeError(errors.handler);
      }

      if(typeof _useCapture === 'boolean') {
        useCapture = _useCapture;
      } else if(typeof _useCapture !== 'undefined') {
        throw new TypeError(errors.useCapture);
      }

      eventsArray.forEach(function(event) {
        element.addEventListener(event, handler, useCapture);
      });
  };

  utils.addMultipleListeners = addMultipleListeners;
}());

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var utils = utils || {};

(function() {
  /**
   *  Distillation of [].forEach.call for iterating over NodeLists, etc.
   *  @param {Array-like Object} array
   *  @param {Function} fn
   */
  function each(array, fn) {
    return [].forEach.call(array, fn);
  }

  function filter(array, fn) {
    return [].filter.call(array, fn);
  }

  var enumerator = {
    each: each,
    filter: filter
  };

  // binds this helper function to the global 'utils'
  utils.enumerator = enumerator;
}());

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var Window = Window || {},
  utils = utils || {};

(function() {
  var isDescendant = function(parent, child) {
    var node;

    if(!validType(parent)) {
      throw new TypeError(err('Parent', parent));
    }

    if(!validType(child)) {
      throw new TypeError(err('Child', child));
    }

    node = child.parentNode;

    while (node !== null) {
      if (node === parent) {
        return true;
      }

      node = node.parentNode;
    }

    return false;
  };

  utils.isDescendant = isDescendant;

  /////////////////////////////////////////////////////////////////////

  function validType(element) {
    return element instanceof HTMLElement || element instanceof Window;
  }

  function err(stringName, element) {
    return stringName + ' must be an HTMLElement or Window. It is currently a(n) ' + typeof element;
  }
}());

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var utils = utils || {};

(function() {
  // checks if the tab key was pressed
  function tab(e) {
    var key = e.keyCode || e.which;

    return key === 9 || key === '9';
  }

  // checks if the enter key was pressed
  function enter(e) {
    var key = e.keyCode || e.which;

    return key === 13 || key === '13';
  }

  // checks if the escape key was pressed
  function esc(e) {
    var key = e.keyCode || e.which;

    return key === 27 || key === '27';
  }

  // checks if the up key was pressed
  function up(e) {
    var key = e.keyCode || e.which;

    return key === 38 || key === '38';
  }

  // checks if the down key was pressed
  function down(e) {
    var key = e.keyCode || e.which;

    return key === 40 || key === '40';
  }

  var keys = {
    enter: enter,
    tab: tab,
    esc: esc,
    up: up,
    down: down
  };

  utils.keys = keys;
}());

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var utils = utils || {};

(function() {
  /**
   *	Selects element based on Element.prototype.querySelectorAll
   *  @param {String} selector
   *  @param {Element} parent
   *	@return {NodeList} {Element} nodeList
   */
  var $ = function() {
    var len = arguments.length,
      isLoneId,
      selector,
      parent,
      nodeList;

    // checks if only a selector is passed in
    if(len === 1 && typeof arguments[0] === 'string') {
      selector = arguments[0].trim();
      isLoneId = selector.indexOf('#') === 0 && selector.indexOf(' ') === -1;
      // use querySelector if a single ID string is passed in, e.g. '#some-id', but not '#some-id .some-class'
      // BUG: $('#some-id #some-other-id') will give a NodeList, but you shouldn't select that way anyway
      nodeList = isLoneId ? document.querySelector(selector) : document.querySelectorAll(selector);

      return nodeList;
    // checks if both a selector and parent are passed in
    } else if (len === 2 && typeof arguments[0] !== 'string') {
      selector = arguments[1];
      parent = arguments[0];
      // if parent is a NodeList, select the first element only
      parent = parent.length > 0 ? parent[0] : parent;
      nodeList = Element.prototype.querySelectorAll.call(parent,selector);

      if (selector.indexOf('#') === 0 ) {
        return nodeList[0];
      } else {
        return nodeList;
      }
    }
  };

  // binds this helper function to the global 'utils'
  utils.$ = $;
}());

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var utils = utils || [];

(function() {
  /**
   *  Flip-flops two classes
   *  @param {HTMLElement} $el
   *  @param {String} _class
   *  @return {Object}
   *
   *	Usage:
   *	utils.swapClass(document.getElementById('some-element'), 'class1').forClass('class2');
   */
  var swapClass = function($el, _class) {
    $el.classList.remove(_class);

    // chain this method
    return {
      forClass: function(__class) {
        return forClass.call(this, $el, __class);
      }
    };
  };

  /////////////////////////////////////////////////////////////////////

  function forClass($el, _class) {
    $el.classList.add(_class);
  }

  utils.swapClass = swapClass;

}());

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var utils = utils || {};

(function() {
  // based on http://codereview.stackexchange.com/questions/47889/alternative-to-setinterval-and-settimeout
  var timeout = function(callback, delay) {
    var dateNow = Date.now,
      requestAnimation = window.requestAnimationFrame,
      start = dateNow(),
      stop,
      timeoutFn = function() {
        return dateNow() - start < delay ? stop || requestAnimation(timeoutFn) : callback();
      };

    requestAnimation(timeoutFn);

    return {
      clear: function(){
        stop = 1;
      }
    };
  };

  utils.timeout = timeout;
}());

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

(function(global) {
  global.components = {};
})(this);

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var components = components || {},
  utils = utils || {};

(function(win) {
  var $ = utils.$,
    each = utils.enumerator.each,
    filter = utils.enumerator.filter,
    timeout = utils.timeout,
    isDescendant = utils.isDescendant,
    activeBarClearTimeout;

  /*
   * Filters out $activeBar from the list
   */
  function notActiveBar(li) {
    return !li.classList.contains('active-bar-horizontal') && !li.classList.contains('active-bar-vertical');
  }

  /**
   *  Hides the $activeBar so that it doesn't slide down on mouseleave
   */
  function stopAnimations() {
    if(this.$activeBar.classList.contains('move')) {
      this.$activeBar.classList.remove('move');
    }

    /**
     * The if-statement is critical, or else when hovering
     * over the navigation menu (but not an item), activeBarClearTimeout
     * is never defined
     */
    if(typeof activeBarClearTimeout !== 'undefined') {
      activeBarClearTimeout.clear();
    }
  }

  /**
   *  Changes the X or Y position of the $activeBar
   */
  function slide(i, $el) {
    /**
     * if-statement is for IE10 so that when hovering
     * over an element [data-active-bar="false"], and then
     * going back to one without that attribute, the bar
     * behaves correctly
     */
    if($el.getAttribute('data-active-bar') !== 'false' && this.turnedOn) {
      // in all browsers, provides X movement
      this.$menu.className = this.direction + ' directional-nav pos-' + i;

      /**
       * The if-statement is critical, or else when moving quickly
       * from one item to another, the class 'move' may stay on
       * even when hovering off of $topNav
       */
      if(this.$activeBar.classList.contains('move') === false) {
        activeBarClearTimeout = timeout(function() {
          this.$activeBar.classList.add('move');
        }.bind(this), 200);
        // this delay is the same as the CSS transition speed
      }
    }
  }

  /**
   *  Selects a link clicked (provides state through CSS class)
   *  Fades in a new title
   */
  function changePage(i, $el) {
    var $parentLi = $el.tagName === 'LI' ? $el : $el.parentNode,
      doesNotLinkToPage = $parentLi.getAttribute('data-page') !== 'false';

    if(doesNotLinkToPage && this.turnedOn) {
      // set some of the aria attributes for accessibility purposes
      $(this.$menu, '[aria-selected="true"]')[0].setAttribute('aria-selected', false);
      $parentLi.setAttribute('aria-selected', true);

      // remove any existing .active classes
      $(this.$menu, '.active')[0].classList.remove('active');

      // make the parent li be .active
      $parentLi.classList.add('active');
    }
  }

  var Menu = function(_config) {
    var config = _config();

    this.direction = config.direction || 'horizontal';
    this.$menu = config.$menu;
    this.turnedOn = this.$menu.getAttribute('data-on') !== 'false';
    this.$menuContainer = $(this.$menu, 'ul')[0];
    this.$menuItems = filter($(this.$menu, 'li'), notActiveBar);
    this.$links = $(this.$menu, 'a');
    this.$activeBar = $('.active-bar-'+this.direction)[0];

    this.$activeBar.setAttribute('tabindex', -1);
    // event listeners

    /**
     * If anywhere outside the navigation menu is clicked,
     * we want to remove all transitions/animations. This is
     * important because when using tab and enter to select a
     * menu item, and then we click outside of the menu, and then
     * tab or click back into the menu, the $activeBar will slide over from
     * its last position (it shouldn't do that; it should 'reset' and then
     * animate up into view, but not slide from its last position).
     *
     * Also, document.activeElement will always be the body or whatever element
     * has a tabindex set on it, so we want to check if the current active element
     * (the one we click on) is a menu item, and if it IS NOT a menu item, then
     * we'll stop animations.
     */
    win.addEventListener('mouseup', function() {
      if(isDescendant(this.$menu, document.activeElement) === false) {
        return this.stopAnimations();
      }
    }.bind(this));

    this.$menu.addEventListener('mouseleave', this.stopAnimations.bind(this));

    /**
     * When transitioning from keyboard interaction to
     * mouse interaction, we have to blur any focus so that
     * the move transitions will work correctly.
     */
    this.$menu.addEventListener('mouseenter', function() {
      each(this.$menuItems, function($li) {
        $li.blur();
      });
    }.bind(this));

    each(this.$menuItems, function($li, i) {
      if(this.turnedOn || $li.hasAttribute('data-icon')) {
        $li.setAttribute('tabindex', 0);
      }
      // be able to provide x and y movement for the $activeBar
      $li.addEventListener('mouseenter', this.slide.bind(this, i, $li));

      $li.addEventListener('keyup', function(e) {
        if(this.turnedOn) {
          // change page on enter key
          if(utils.keys.enter(e)) {
            return this.changePage(i, $li);
          }

          // slide the active bar on tab or shift+tab
          if(utils.keys.tab(e)) {
            return this.slide(i, $li);
          }
        }
      }.bind(this));
    }.bind(this));

    each(this.$links, function($a, i) {
      $a.setAttribute('tabindex', -1);
      $a.addEventListener('click', this.changePage.bind(this, i, $a));
    }.bind(this));

  };

  Menu.prototype = {
    stopAnimations: stopAnimations,
    slide: slide,
    changePage: changePage
  };

  components.Menu = Menu;
})(this);

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var components = components || {},
  utils = utils || {};

(function(global) {
  var $ = utils.$;

  function show() {
    var scrollerHeight = this.calculateScrollerHeight();

    // if we need a scrollbar, then style it
    if (scrollerHeight / this.$container.offsetHeight < 1) {
      this.scroll();
      this.$scroller.classList.remove('fade-out');

      this.$scroller.style.height = scrollerHeight + 'px';
    }
  }

  function hide() {
    this.$scroller.classList.add('fade-out');
  }

  function calculateScrollerHeight() {
    // ratio of the portion of the list that's visible by the actual height, including hidden overflow
    var ratio = this.$list.offsetHeight / this.$list.scrollHeight;

    return ratio * this.$list.offsetHeight;
  }

  /**
   * Sets the top position of the scrollbar while scrolling with the scroll wheel on the mouse
   */
  function scroll() {
    var scrollPercentage = this.$list.scrollTop / this.$list.scrollHeight,
    // 5px arbitrary offset so scroll bar doesn't
    // move too far beyond content wrapper bounding box
      topPosition = scrollPercentage * (this.$container.offsetHeight - 40);

    this.$scroller.style.top = topPosition + 'px';
  }

  /**
   * Stores the initial positions of the content and scrollbar
   */
  function startDrag(e) {
    this.position.start = e.pageY;
    this.position.content = this.$list.scrollTop;
    this.dragging = true;
  }

  function stopDrag() {
    this.dragging = false;
  }

  /**
   * Sets the top position of the scrollbar while dragging it (holding down mouse button and moving up and down)
   */
  function dragScroll(e) {
    var mouseDifferential = e.pageY - this.position.start,
      scrollEquivalent = mouseDifferential * (this.$list.scrollHeight / this.$container.offsetHeight);

    if (this.dragging === true) {
      this.$list.scrollTop = this.position.content + scrollEquivalent;
    }
  }

  var Scrollable = function(_config) {
    var config = _config();

    this.$container = config.$container;
    this.$list = $(this.$container, '.dropdown-options > ul')[0];
    this.$scroller = config.$scroller;
    this.dragging = false;
    this.position = {
      content: 0,
      start: 0,
      stop: 0
    };

    this.$scroller.setAttribute('aria-hidden', true);
    this.$scroller.setAttribute('tabindex', -1);
    this.$scroller.addEventListener('mousedown', this.drag.start.bind(this));
    global.addEventListener('mouseup', this.drag.stop.bind(this));
    global.addEventListener('mousemove', this.drag.scroll.bind(this));

    this.$list.addEventListener('scroll', this.scroll.bind(this));
  };

  Scrollable.prototype = {
    show: show,
    hide: hide,
    calculateScrollerHeight: calculateScrollerHeight,
    scroll: scroll,
    drag: {
      start: startDrag,
      stop: stopDrag,
      scroll: dragScroll
    }
  };

  components.Scrollable = Scrollable;
})(this);

/*
Licensed Materials - Property of IBM

© Copyright IBM Corporation 2015. All Rights Reserved.

This licensed material is licensed under the Apache 2.0 license. http://www.apache.org/licenses/LICENSE-2.0.
*/

var utils = utils || {},
  components = components || {};

(function() {
  var $ = utils.$;

  /**
   *  Generates an HTMLElement for use in injecting into the DOM
   *  @return {SearchDataObject} this (used for chaining methods)
   */
  function build() {
    this.span.appendChild(document.createTextNode(this.text));
    this.li.appendChild(this.span);

    return this;
  }

  /**
   *  Selects element based on Element.prototype.querySelectorAll
   *  @param {String} selector
   *  @param {Element} parent
   *  @return {NodeList} {Element} nodeList
   */
  function placeElementIn(parent) {
    parent.appendChild(this.li);
  }

  /**
   *  Shows or hides elements based on the search text
   *  @param {String} exp
   */
  function test(exp) {
    // hide if the search is blank
    if(exp.test('')) {
      this.setInactive();
      return false;
    }

    // show the element if the search text matches the element text
    if(exp.test(this.text)) {
      this.setActive();
    } else {
      this.setInactive();
    }
  }

  function setActive() {
    this.li.classList.add('matched');
    this.li.setAttribute('tabindex', 0);
    this.span.className = 'enter';
  }

  function setInactive() {
    this.li.classList.remove('matched');
    this.li.setAttribute('tabindex', -1);
    this.span.className = '';
  }

  /**
   *  Holds information about a search query and generates list items
   *  to show or hide based on whether the content matches the query
   *
   *  Usage:
   *  new SearchDataObject(item).build().placeElementIn($resultsContainer);
   *
   *  .build() can be used later to delay building the item
   *  .placeElementIn(HTMLElement) can also be used later to delay placing the elements
   */
  var SearchDataObject = function(text) {
    this.text = text;
    this.li = document.createElement('li');
    this.span = document.createElement('span');

    this.li.setAttribute('role', 'option');
    this.li.setAttribute('tabindex', -1);
    this.li.classList.add('result');

    this.li.addEventListener('keyup', function(e) {
      var $next,
        $previous;

      // Uncomment the next line to disable tab and shift+tab functionality when selecting an option
      // e.preventDefault();

        // up key functionality
        if(utils.keys.up(e)) {
          $previous = this.previousSibling;

          // go to either the previous option, or if you're already on
          // the first option, use the up arrow key to focus on the $toggle
          if($previous.tagName === 'LI' && +$previous.getAttribute('tabindex') !== -1) {
            this.blur();
          } else {
            $previous = $('.search-input')[0];
          }

          if(+$previous.getAttribute('tabindex') !== -1) {
            $previous.focus();
          }
        // down key functionality
        } else if (utils.keys.down(e)) {
          $next = this.nextSibling;

          // we can't go past the last element in the list, or there will be an error
          if($next !== null && $next.getAttribute('tabindex') !== -1) {
            this.blur();
            $next.focus();
          }
        }
    });
  };

  SearchDataObject.prototype = {
    build: build,
    placeElementIn: placeElementIn,
    test: test,
    setActive: setActive,
    setInactive: setInactive
  };

  components.SearchDataObject = SearchDataObject;

  // REVIEW: why do I have this return here?
  return SearchDataObject;
}());
