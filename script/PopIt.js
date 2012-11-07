/*! 
 * Copyright (c) 2009 Michael Harris michael@harrisdev.net
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * If you do choose to use this,
 * please drop me an email at michael@harrisdev.net
 * I would like to see where this ends up :)
 */
(function(){
  var REQUIRED_PROTOTYPE = '1.6.0.3';
  var REQUIRED_SCRIPTY = '1.8.1';
  var checkRequirements = function(){
    var convertVersionString = function(versionString){ // taken from script.aculo.us
      var v = versionString.replace(/_.*|\./g, '');
      v = parseInt(v + '0'.times(4 - v.length), 10);
      return versionString.indexOf('_') > -1 ? v - 1 : v;
    };
    if ((typeof Prototype == 'undefined') ||
    (typeof Element == 'undefined') ||
    (typeof Element.Methods == 'undefined') ||
    (convertVersionString(Prototype.Version) <
    convertVersionString(REQUIRED_PROTOTYPE))) {
      throw ("PopIt requires the Prototype JavaScript framework >= " +
      REQUIRED_PROTOTYPE +
      " from http://prototypejs.org/");
    }
    
    var scriptyCheckFailed = (typeof Scriptaculous == 'undefined') ||
    (convertVersionString(Scriptaculous.Version) <
    convertVersionString(REQUIRED_SCRIPTY));
    if (scriptyCheckFailed) {
      throw ("PopIt requires the script.aculo.us JavaScript framework >= " +
      REQUIRED_SCRIPTY2 +
      " from http://script.aculo.us/");
    }
    
  };
  checkRequirements();
  
  popIts = { // global popIts var for managing open popIts
    activePopIts: {},
    zIndex: 1000,
    onlyOneVisible: false,
    closeAll: function(){
      popIts.closeNext();
    },
    closeNext:function(lastEl){
      var nextPopIt = typeof lastEl == 'undefined' ? Object.values(popIts.activePopIts).find(function(otherPopIt){
        return otherPopIt.visible;
      }) : lastEl;
      if (!nextPopIt) {
        if (Object.keys(popIts.activePopIts).length) {
          nextPopIt = popIts.activePopIts[Object.keys(popIts.activePopIts).first()];
        }
      }
      if (nextPopIt) {
        var oldPopit = nextPopIt.popIt;
        if (oldPopit){
          oldPopit = popIts.activePopIts[oldPopit.identify()];
          if (oldPopit) {
            oldPopit.visible = true;
          }
        }
        nextPopIt.effectDuration = 0.2;
        nextPopIt.close(null, popIts.closeNext.curry(nextPopIt.lastPopIt));
      }
      else {
        Object.values(popIts.activePopIts).each(function(popIt){
          popIt.close();
        });
      }
    },
    resize: function(ev){
      Object.values(popIts.activePopIts).each(function(popIt){
        popIt.center(ev);
        popIt.onPageResized();
      });
    },
    keyDown: function(ev){
      if (this.onlyOneVisible) {
        var popIt = Object.values(popIts.activePopIts).find(function(otherPopIt){
          return otherPopIt.visible;
        });
        if (popIt && popIt.escapeClosesPopIt && popIt.isClosable) {
          popIt.keyDown(ev);
        }
      }
      else {
        Object.values(popIts.activePopIts).each(function(popIt){
          if (popIt.escapeClosesPopIt && popIt.isClosable) {
            popIt.keyDown(ev);
          }
        });
      }
    },
    keyDownCustom: function(ev){
      if (ev.memo && ev.memo.type === 'keydown'){
        this.keyDown(ev.memo);
      }
    }
  };
  Event.observe(window, 'resize', popIts.resize.bind(popIts));
  Event.observe(document, 'keydown', popIts.keyDown.bind(popIts));
  Event.observe(document, 'PopIt:keydown', popIts.keyDownCustom.bind(popIts));

  PopIt = Class.create({
    version: 0.9,
    initialize: function(content, params){
      Object.extend(this, { // default params
        id: false,
        content: content,
        title: '&nbsp;', //the window title
        parent: $(document.body), //what element to insert the PopIt into
        scrollElement: document.documentElement && document.documentElement.scrollTop ? document.documentElement : document.body,
        height: 150, //the height of the PopIt
        width: 200, // the width of the PopIt
        shimOpacity: 0.9, // the opacity to use for the various cover divs
        isModal: false, // if he window is a modal dialog or not
        closeOnModalClick: false, // close the modal dialog when clicking on the background
        isDraggable: true, // if dragging is enabled
        isResizable: true, // if resizing is enabled
        isAutoResized: false, // if the popit should auto resize to the dimensions of its content
        isMinimizable: true, // if minimize functions are enabled
        isMaximizable: true, // if maximize functions are enabled
        isClosable: true, // if closing functions are enabled
        escapeClosesPopIt: true, // if pressing the escape key closes all PopIts
        isUrl: false, // if content type is a url and an iframe should be used
        offsetTop: 20, //the amount of px to add to the top of the PopIt
        effectDuration: 0.5, //the duration of the various effects that happen with the PopIt
        className: "", //the base classname to use for the PopIt 
        showStatusBar: false,
        postData: null,
        beforeClose: Prototype.emptyFunction,
        afterClose: Prototype.emptyFunction,
        beforeShow: Prototype.emptyFunction,
        afterShow: Prototype.emptyFunction,
        onPageResized: Prototype.emptyFunction,
        afterResize: Prototype.emptyFunction,
        useEffects: true,
        fixedPosition: false
      });
      
      Object.extend(this, params);
      
      if (this.id && $(this.id)) { // modify existing popit
        Object.extend(this, popIts.activePopIts[this.id]);
        return;
      }
      
      this.generatePopIt();
      
      this.autoResize();
    },
    
    keyDown: function(event){
      //note this will not work for is url content while focused inside the content due to the iframe 
      if (event.keyCode == Event.KEY_ESC) {
        this.close(event);
      }
    },    
    
    refreshDragDrop: function(){
      if (this.isDraggable) {
        this.titleDrag = new Draggable(this.popIt, {
          handle: this.titleBarDiv,
          onStart: (function(draggable, event){
            if (this.isUrl) {
              this.createShim();
              this.contentDiv.insert(this.shim);
              this.shim.show();
            }
          }).bind(this),
          onEnd: (function(draggable, event){
            if (this.isUrl) {
              this.shim.hide();
            }
            if (parseInt(this.popIt.getStyle('top'), 10) < 0) {
              this.popIt.setStyle({
                top: 0
              });
            }
            if (parseInt(this.popIt.getStyle('left'), 10) < 0) {
              this.popIt.setStyle({
                left: 0
              });
            }
            
          }).bind(this)
        });
      }
      
      if (!this.isResizable) {
        return;
      }
      
      this.topResizeDrag = new Draggable(this.topResizeDiv, {
        constraint: 'vertical',
        onStart: (function(draggable, event){
          this.origY = event.pointerY() - this.padBottom;
          this.showDragShim(draggable, 'TB');
        }).bind(this),
        onEnd: (function(draggable, event){
          var y = event.pointerY() - this.padBottom;
          this.height = this.popIt.getHeight() + (this.origY - y);
          if (y < 10) {
            this.height += y;
            y = 10;
          }
          this.height -= this.padBottom;
          y += this.padBottom;
          
          var minHeight = parseInt(this.popIt.getStyle('min-height'), 10);
          if (this.height < minHeight) {
            var dif = minHeight - this.height;
            this.height = minHeight;
            y -= dif;
          }
          
          this.popIt.setStyle({
            top: y + 'px',
            height: this.height + 'px'
          });
          this.topResizeDiv.setStyle({
            bottom: '',
            top: ''
          });
          if (this.shim) {
            this.shim.setStyle({
              height: this.popIt.getHeight() + 'px'
            });
          }
          
          this.rightResizeDiv.setStyle({
            height: this.popIt.getHeight() + 'px'
          });
          this.leftResizeDiv.setStyle({
            height: this.popIt.getHeight() + 'px'
          });
          
          this.origY = null;
          this.hideDragShim(draggable);
        }).bind(this)
      });
      
      this.rightResizeDrag = new Draggable(this.rightResizeDiv, {
        constraint: 'horizontal',
        onStart: (function(draggable, event){
          this.origX = event.pointerX();
          this.showDragShim(draggable, 'LR');
        }).bind(this),
        onEnd: (function(draggable, event){
          var x = event.pointerX();
          this.width = this.popIt.getWidth() + (x - this.origX);
          var parentWidth = ($(document.body) == this.parent ? document.viewport.getWidth() : this.parent.getWidth()) - 10;
          if (x > parentWidth) {
            var sub = (parentWidth - x);
            x += sub;
            this.width += sub;
          }
          var minWidth = parseInt(this.popIt.getStyle('min-width'), 10);
          if (this.width < minWidth) {
            var dif = minWidth - this.width;
            this.width = minWidth;
            x -= dif;
          }
          
          this.popIt.setStyle({
            right: x + 'px',
            width: this.width + 'px'
          });
          this.rightResizeDiv.setStyle({
            left: '',
            right: ''
          });
          
          this.origX = null;
          this.hideDragShim(draggable);
        }).bind(this)
      });
      
      this.bottomResizeDrag = new Draggable(this.bottomResizeDiv, {
        constraint: 'vertical',
        onStart: (function(draggable, event){
          this.origY = event.pointerY() - this.scrollElement.scrollTop;
          this.showDragShim(draggable, 'TB');
        }).bind(this),
        onEnd: (function(draggable, event){
          var y = event.pointerY() - this.scrollElement.scrollTop;
          this.height = this.popIt.getHeight() + (y - this.origY);
          
          var parentHeight = ($(document.body) == this.parent ? document.viewport.getHeight() : this.parent.getHeight()) - 10;
          if (y > parentHeight) {
            var sub = parentHeight - y;
            y += sub;
            this.height += sub;
          }
          this.height -= this.padBottom;
          
          var minHeight = parseInt(this.popIt.getStyle('min-height'), 10);
          if (this.height < minHeight) {
            var dif = minHeight - this.height;
            this.height = minHeight;
            y -= dif;
          }
          
          this.popIt.setStyle({
            height: this.height + 'px'
          });
          this.bottomResizeDiv.setStyle({
            bottom: '',
            top: ''
          });
          
          if (this.shim) {
            this.shim.setStyle({
              height: this.popIt.getHeight() + 'px'
            });
          }
          this.rightResizeDiv.setStyle({
            height: this.popIt.getHeight() + 'px'
          });
          this.leftResizeDiv.setStyle({
            height: this.popIt.getHeight() + 'px'
          });
          
          this.origY = null;
          this.hideDragShim(draggable);
          this.afterResize();
        }).bind(this)
      });
      
      
      this.leftResizeDrag = new Draggable(this.leftResizeDiv, {
        constraint: 'horizontal',
        onStart: (function(draggable, event){
          this.origX = event.pointerX();
          this.showDragShim(draggable, 'LR');
        }).bind(this),
        onEnd: (function(draggable, event){
          var x = event.pointerX();
          this.width = this.popIt.getWidth() + (this.origX - x);
          if (x < 10) {
            this.width += x - 10;
            x = 10;
          }
          var minWidth = parseInt(this.popIt.getStyle('min-width'), 10);
          if (this.width < minWidth) {
            var dif = minWidth - this.width;
            this.width = minWidth;
            x -= dif;
          }
          
          this.popIt.setStyle({
            left: x + 'px',
            width: this.width + 'px'
          });
          this.leftResizeDiv.setStyle({
            right: '',
            left: ''
          });
          
          this.origX = null;
          this.hideDragShim(draggable);
          this.afterResize();
        }).bind(this)
      });
    },
    
    createShim: function(){
      if (!this.shim) {
        this.shim = new Element('div', {
          className: 'shim'
        }).setStyle({
          height: this.popIt.getHeight() + 'px',
          opacity: this.shimOpacity
        });
      }
    },
    showDragShim: function(draggable, LRTB){
      this.createShim();
      this.popIt.insert(this.shim);
      draggable.element.addClassName('resizing' + LRTB);
      this.shim.show();
    },
    
    hideDragShim: function(draggable){
      draggable.element.removeClassName('resizingLR');
      draggable.element.removeClassName('resizingTB');
      this.shim.hide();
    },
    
    generatePopIt: function(){
      this.beforeShow();

      if (this.isModal) {
        this.modalShim = new Element('div', {
          className: 'ModalShim'
        }).setStyle({
          opacity: this.shimOpacity,
          zIndex: popIts.zIndex++
        });
        if (this.closeOnModalClick && this.isClosable){
          this.modalShim.observe('mousedown', this.close.bindAsEventListener(this));
        }
        this.modalShim.hide();
        this.parent.insert(this.modalShim);
        this.modalShim[this.useEffects ? 'appear' : 'show']({
          from: 0,
          to: this.shimOpacity,
          duration: this.effectDuration
        });
      }
      if (popIts.onlyOneVisible){
        this.lastPopIt = Object.values(popIts.activePopIts).find(function(otherPopIt){
          return otherPopIt.visible;
        });
        if (this.lastPopIt) {
          this.lastPopIt.visible = false;
          var oldPop = this.lastPopIt.popIt;
          this.lastPopIt.oldPosition = {
            left: oldPop.getStyle('left'),
            top: oldPop.getStyle('top')
          };
          var style = { // move instead of hide to prevent any issues with internal resize events, etc.
            left: '-10000px',
            top: '-10000px'
          };
          if (this.useEffects) {
            new Effect.Morph(oldPop, {
              style: style,
              duration: this.effectDuration
            });
          }
          else {
            oldPop.setStyle(style);
          }
        }
      }
      this.popIt = new Element('div', {
        className: "popIt " + this.className
      }).setStyle({
        top: this.fixedPosition ? this.offsetTop + 'px': (this.scrollElement.scrollTop + this.offsetTop) + 'px',
        width: this.width + 'px',
        height: this.height + 'px',
        zIndex: popIts.zIndex++,
        position: this.fixedPosition ? "fixed" : "absolute"
      });
      this.visible = true;
      if (this.id) {
        this.popIt.id = this.id;
      }
      else {
        this.id = this.popIt.identify();
      }
      popIts.activePopIts[this.id] = this;
      
      this.generateTitleBar();
      this.generateContentDiv();
      this.generateStatusBarDiv();
      
      this.popIt.hide();
      this.parent.insert(this.popIt);
      this.padBottom = parseInt(this.popIt.getStyle('padding-bottom'), 10);
      this.center();
      this.generateResizeElements();
      
      var afterFinish = (function(){
        try {//incase the opener has redirected in ie
          this.afterShow();
          this.content.contentWindow.focus();
        }catch(e){}
      }).bind(this);
      
      if (this.useEffects) {
        new Effect.Appear(this.popIt, {
          duration: this.effectDuration,
          afterFinish: afterFinish
        });
      }
      else {
        this.popIt.show();
        afterFinish();
      }     
      
      this.refreshDragDrop();
    },
    
    center: function(){
      var left = ($(document.body) == this.parent ? document.viewport.getWidth() : this.parent.getWidth()) / 2;
      left = left - (this.popIt.getWidth() / 2);
      left += 'px';
      
      this.popIt.setStyle({
        left: left
      });
    },
    
    generateResizeElements: function(){
      if (this.isDraggable) {
        this.titleBarDiv.setStyle({
          cursor: 'move'
        });
      }
      if (!this.isResizable) {
        return;
      }
      
      this.topResizeDiv = new Element('div', {
        className: 'topResize'
      });
      this.popIt.insert(this.topResizeDiv);
      
      this.rightResizeDiv = new Element('div', {
        className: 'rightResize'
      });
      this.popIt.insert(this.rightResizeDiv);
      
      this.bottomResizeDiv = new Element('div', {
        className: 'bottomResize'
      });
      this.popIt.insert(this.bottomResizeDiv);
      
      this.leftResizeDiv = new Element('div', {
        className: 'leftResize'
      });
      if (Prototype.Browser.IE) {
        //this code causes a blink in firefox and isnt needed 
        //but ie wont size the resize elements correctly without it
        this.rightResizeDiv.setStyle({
          height: this.popIt.getHeight() + 'px'
        });
        this.leftResizeDiv.setStyle({
          height: this.popIt.getHeight() + 'px'
        });
      }
      
      this.popIt.insert(this.leftResizeDiv);
    },
    
    generateTitleBar: function(){
      this.titleBarDiv = new Element('div', {
        className: 'TitleBar'
      });
      
      if (this.isMaximizable) {
        this.titleBarDiv.observe('dblclick', this.maximize.bindAsEventListener(this));
      }
      
      var controlsDiv = new Element('div', {
        className: 'Controls'
      });
      
      if (this.isMinimizable) {
        this.minimizeButton = new Element('div', {
          className: 'minimizeButton'
        }).observe('mousedown', this.minimize.bindAsEventListener(this));
        controlsDiv.insert(this.minimizeButton);
      }
      
      if (this.isMaximizable) {
        this.maximizeButton = new Element('div', {
          className: 'maximizeButton'
        }).observe('mousedown', this.maximize.bindAsEventListener(this));
        controlsDiv.insert(this.maximizeButton);
      }
      
      if (this.isClosable) {
        this.closeButton = new Element('div', {
          className: 'closeButton'
        }).observe('mousedown', this.close.bindAsEventListener(this));
        controlsDiv.insert(this.closeButton);
      }
      
      this.titleBarDiv.insert(controlsDiv);

      this.titleEl = new Element('span');
      
      this.updateTitle(this.title);
      
      this.titleBarDiv.insert(this.titleEl);
      
      this.popIt.insert(this.titleBarDiv);
    },
    updateTitle: function(title){
      this.title = title;
      this.titleEl.update(this.title);
    },
    generateContentDiv: function(){     
      var post = Prototype.emptyFunction;
      
      this.contentDiv = new Element('div', {
        className: 'Content'
      });
           
      if (this.isUrl) {
        var url = this.content;
        if (this.postData) {
          this.content = new Element('iframe', {
            frameborder: 0, //required for ie
            className: 'ContentIFrame',
            name: 'PopItForm_' + this.id,
            src: vs.urls.virtualPath + 'blank.htm'
          });
          
          var form = new Element('form', {
            action: url,
            'class': 'Hidden',
            method: 'post',
            target: 'PopItForm_' + this.id
          }).insert(new Element('input', {
            type: 'hidden',
            name: 'PopIt_FormData',
            value: Object.toJSON(this.postData)
          }));
          this.contentDiv.insert(form);

          post = function(){
            form.submit();
            form.remove();
          };
        }
        else {
          this.content = new Element('iframe', {
            frameborder: 0, //required for ie
            className: 'ContentIFrame',
            src: url
          });
        }
      }
      
      this.contentDiv.insert(this.content);
      
      if (this.isUrl) {
        this.contentDiv.setStyle({
          padding: '0'
        });
      }
      
      this.popIt.insert(this.contentDiv);
      post.delay(0);
    },
    
    generateStatusBarDiv: function(){
      if (this.showStatusBar) {
        this.statusBarDiv = new Element('div', {
          className: 'Status'
        });
        
        this.popIt.insert(this.statusBarDiv);
      }
    },
    
    minimize: function(event){
      if (event) {
        if (!event.isLeftClick()){
          return;
        }
        event.stop();
      }
      this.isMinimized = !this.isMinimized;
      var style;
      if (this.isMinimized) {
        this.popIt.setStyle({
          minHeight: '0'
        });
        style = { 
          height: '0px'
        };
        if (this.useEffects) {
          new Effect.Morph(this.popIt, {
            style: style,
            duration: this.effectDuration,
            afterFinish: this.afterResize.bind(this)
          });
        }
        else {
          this.popIt.setStyle(style);
          this.afterResize();
        }
        if (this.isResizable) {
          this.topResizeDiv.hide();
          this.bottomResizeDiv.hide();
          this.rightResizeDiv.setStyle({
            height: this.popIt.getStyle('paddingBottom')
          });
          this.leftResizeDiv.setStyle({
            height: this.popIt.getStyle('paddingBottom')
          });
        }
        if (this.shim) {
          this.shim.setStyle({
            height: this.popIt.getStyle('paddingBottom')
          });
        }
      }
      else {
        var height = this.height;
        
        if (this.isMaximized) {
          height = (($(document.body) == this.parent ? document.viewport.getHeight() : this.parent.getHeight()) - 5);
        }
        style = { 
          height: height + 'px',
          minHeight: ''
        };
        if (this.useEffects) {
          new Effect.Morph(this.popIt, {
            style: style,
            duration: this.effectDuration,
            afterFinish: this.afterResize.bind(this)
          });
        }
        else {
          this.popIt.setStyle(style);
          this.afterResize();
        }
        this.contentDiv.show();
        if (this.showStatusBar) {
          this.statusBarDiv.show();
        }
        if (this.isResizable) {
          this.topResizeDiv.show();
          this.bottomResizeDiv.show();
          this.rightResizeDiv.setStyle({
            height: (height + this.padBottom) + 'px'
          });
          this.leftResizeDiv.setStyle({
            height: (height + this.padBottom) + 'px'
          });
        }
        if (this.shim) {
          this.shim.setStyle({
            height: (height + this.padBottom) + 'px'
          });
        }
      }
      
    },
    autoResize: function(){
     
     if (this.isUrl && this.isAutoResized){
       if (this.content && this.content.contentWindow){
          var contentBody = this.content.contentWindow.document.body;
          if (contentBody) {
            
            var height = parseInt(contentBody.scrollHeight, 10);
            var max = (($(document.body) == this.parent ? document.viewport.getHeight() : this.parent.getHeight()) - this.padBottom - 2);
            max -= parseInt(this.popIt.getStyle('top'), 10);
            max -= 10;// small padding just to keep it from bottom of screen
            if (height > max){
              height = max;
            }
            
            if (height != this.origHeight) {
             
              this.origHeight = height;
              
              this.contentDiv.setStyle({
                height: this.origHeight + 'px'
              });
              this.popIt.setStyle({
                height: this.origHeight + 'px'
              });
              
            }
          }
          this.autoResize.bind(this).delay(0.1); 
        }  
      }  
    },
    maximize: function(event){
      if (event) {
        if (event.type == "mousedown" && !event.isLeftClick()){ // isLeftClick only works on IE when event is mouse down
          return;
        }
        event.stop();
        if (event.element().hasClassName('minimizeButton')) {
          return;
        }
      }
      if (this.isUrl){
        this.content.setStyle({
          height: this.content.getHeight()+'px',
          width: this.content.getWidth()+'px'
        });
      }
      this.isMaximized = !this.isMaximized;
      this.isMinimized = true;//this will maximize the window into view gets toggled back in this.minimize();
      this.minimize(event);
      
      var afterFinish = (function(){
        if (this.isUrl) {
          this.content.setStyle({
            height: '',
            width: ''
          });
        }
        this.afterResize();
      }).bind(this);
      var style;
      
      if (this.isMaximized) {
        this.left = parseInt(this.popIt.getStyle('left'), 10);
        this.top = parseInt(this.popIt.getStyle('top'), 10);
        this.maximizeButton.addClassName('restoreButton');

        style = { 
          left: '0px',
          top: (this.fixedPosition ? this.offsetTop: this.scrollElement.scrollTop) + 'px',
          width: (($(document.body) == this.parent ? document.viewport.getWidth() : this.parent.getWidth()) - 3) + 'px',
          height: (($(document.body) == this.parent ? document.viewport.getHeight() : this.parent.getHeight()) - this.padBottom - 2) + 'px'
        };
        
        if (this.useEffects) {
          new Effect.Morph(this.popIt, {
            style: style,
            duration: this.effectDuration,
            afterFinish: afterFinish
          });
        }
        else {
          this.popIt.setStyle(style);
          afterFinish();
        }

        if (this.isResizable) {
          this.topResizeDiv.hide();
          this.rightResizeDiv.hide();
          this.bottomResizeDiv.hide();
          this.leftResizeDiv.hide();
        }
      }
      else {
        this.maximizeButton.removeClassName('restoreButton');

        style = { 
          width: this.width + 'px',
          height: this.height + 'px',
          left: this.left + 'px',
          top: this.top + 'px'
        };
        
        if (this.useEffects) {
          new Effect.Morph(this.popIt, {
            style: style,
            duration: this.effectDuration,
            afterFinish: afterFinish
          });
        }
        else {
          this.popIt.setStyle(style);
          afterFinish();
        }

        if (this.isResizable) {
          this.topResizeDiv.show();
          this.rightResizeDiv.show();
          this.bottomResizeDiv.show();
          this.leftResizeDiv.show();
        }
      }
    },
    
    close: function(event, callback){
      if (event) {
        if (event.type == 'click' && !event.isLeftClick()){
          return;
        }
        event.stop();
      }

      this.beforeClose();

      if (this.modalShim) {
        this.modalShim.stopObserving();
        this.modalShim[this.useEffects ? "fade" : "hide"]({
          duration: this.effectDuration
        });
      }
      if (this.shim) {
        this.shim.hide();
      }
      
      var afterFinish = (function(){
        try {
          this.afterClose();
        } 
        catch (e) {
        }
        if (this.lastPopIt) {
          this.lastPopIt.popIt.setStyle(this.lastPopIt.oldPosition);
          this.lastPopIt.center();
          this.lastPopIt.visible = true;
          this.lastPopIt = null;
        }
        
        this.destroy(callback);
      }).bind(this);
      
      if (this.useEffects){
        new Effect.Fade(this.popIt, {
          duration: this.effectDuration,
          afterFinish: afterFinish        
        });
      }
      else {
        this.popIt.hide();
        afterFinish();
      }
    },
    
    updateStatusText: function(text){
      if (this.showStatusBar) {
        this.statusBarDiv.update(text);
      }
    },
    
    destroy: function(callback, retryCounter){
      if (this.isUrl){
        var tryAgain = false, starting = typeof retryCounter == 'undefined';
        retryCounter = starting ? 10 : retryCounter;
        if (starting && this.content.src != vs.urls.virtualPath + 'blank.htm') {
            this.content.src = vs.urls.virtualPath + 'blank.htm';
        }
        try {
            if (!this.content.contentWindow.document.body.innerHTML.empty()) {
                tryAgain = true;
            }
        }
        catch (e) {
            tryAgain = true;
        }
        if (tryAgain && retryCounter){
          this.destroy.bind(this, callback, retryCounter--).delay(0.2);
          return;
        }
      }
      this.titleBarDiv.stopObserving();
      if (this.minimizeButton) {
        this.minimizeButton.stopObserving();
      }
      if (this.maximizeButton) {
        this.maximizeButton.stopObserving();
      }
      if (this.closeButton) {
        this.closeButton.stopObserving();
      }
      
      if (this.titleDrag) {
        this.titleDrag.destroy();
      }
      if (this.topResizeDrag) {
        this.topResizeDrag.destroy();
      }
      if (this.rightResizeDrag) {
        this.rightResizeDrag.destroy();
      }
      if (this.bottomResizeDrag) {
        this.bottomResizeDrag.destroy();
      }
      if (this.leftResizeDrag) {
        this.leftResizeDrag.destroy();
      }
      
      if (this.modalShim && this.modalShim.parentNode) {
        this.modalShim.stopObserving().remove();
      }
      
      if (this.popIt && this.popIt.parentNode) {
        this.popIt.remove();
      }
      
      if (this.shim && this.shim.parentNode) {
        this.shim.remove();
      }
      delete popIts.activePopIts[this.id];
      if (typeof callback == 'function'){
        callback();
      }
    }
  });
})();
