//Copyright (c) 2009 Michael Harris michael@harrisdev.net
//
//Permission is hereby granted, free of charge, to any person
//obtaining a copy of this software and associated documentation
//files (the "Software"), to deal in the Software without
//restriction, including without limitation the rights to use,
//copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the
//Software is furnished to do so, subject to the following
//conditions:
//
//The above copyright notice and this permission notice shall be
//included in all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
//OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
//HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
//WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
//OTHER DEALINGS IN THE SOFTWARE.


//If you do choose to use this,
//please drop me an email at michael@harrisdev.net
//I would like to see where this ends up :)

var PopIt = Class.create();
PopIt.version = 0.1;

PopIt.prototype = {
    initialize: function(content, params)
    {
		//requirements
		if (typeof(Prototype) == 'undefined' || (parseFloat(Prototype.Version.split(".")[0] + "." + Prototype.Version.split(".")[1]) < 1.6)) 
		{
			throw (new Error('PopIt: requires Prototype 1.6.0+'));
		}
		if (typeof(Effect) == 'undefined') 
		{
			throw (new Error('PopIt: requires Script.aculo.us, specifically Effects'));
		}
		if (typeof(Draggable) == 'undefined') 
		{
			throw (new Error('PopIt: requires Script.aculo.us, specifically DragDrop'));
		}
		
		this.content = content;
		this.title = '&nbsp;'; //the window title
		this.parent = $(document.body); //what element to insert the PopIt into
		this.scrollElement = document.documentElement ? document.documentElement : document.body;
		this.height = '150px'; //the height of the PopIt
		this.width = '200px'; // the width of the PopIt
		this.shimOpacity = 0.9; // the opacity to use for the various cover divs
		this.isModal = false; // if he window is a modal dialog or not
		this.isDraggable  = true; // if dragging is enabled
		this.isResizable = true; // if resizing is enabled
		this.isMinimizable = true; // if minimize functions are enabled
		this.isMaximizable = true; // if maximize functions are enabled
		this.isClosable = true; // if closing functions are enabled
		this.escapeClosesPopIt = true; // if pressing the escape key closes all PopIts
		this.isUrl = false; // if content type is a url and an iframe should be used
		this.offsetTop = 20; //the amount of px to add to the top of the PopIt
		this.effectDuration = 0.5; //the duration of the various effects that happen with the PopIt
		this.className = "defaultPopIt"; //the base classname to use for the PopIt 

		
		Object.extend(this, params);
		
		//TODO browser compatibility
		//todo more css
		
		this.generatePopIt();

		this.centerHandler = this.center.bindAsEventListener(this);
		Event.observe(window, 'resize', this.centerHandler);
		if (this.escapeClosesPopIt) 
		{
			this.keyDownHandler = this.keyDown.bindAsEventListener(this);
			Event.observe(document, 'keydown', this.keyDownHandler);
		}
	},
	
	keyDown: function(event)
	{
		//note this will not work for is url content while focused inside the content due to the iframe 
		if (event.keyCode == Event.KEY_ESC)
		{
			this.close(event);
		}
	},
	
	
	refreshDragDrop: function()
	{
		if (this.isDraggable) 
		{
			this.titleDrag = new Draggable(this.PopIt, 
			{
				handle: this.titleBarDiv,
				scroll: $(this.scrollElement),//todo ie doesnt like this for some reason
				onStart: function(draggable, event)
				{
					if (this.isUrl) 
					{
						this.createShim();
						this.contentDiv.insert(this.shim);
						this.shim.show();
					}
				}.bind(this),
				onEnd: function(draggable, event)
				{
					if (this.isUrl) 
					{
						this.shim.hide();
					}
					if (parseInt(this.PopIt.getStyle('top'), 10) < 0)
					{
						this.PopIt.setStyle(
						{
							top: 0
						});
					}
					if (parseInt(this.PopIt.getStyle('left'), 10) < 0)
					{
						this.PopIt.setStyle(
						{
							left: 0
						});
					}

				}.bind(this)
			});
		}
		
		if (!this.isResizable) 
		{
			return;
		}
		
		this.topResizeDrag = new Draggable(this.topResizeDiv, 
		{
			constraint: 'vertical',
			onStart: function(draggable, event)
			{
				this.origY = event.pointerY() - parseInt(this.PopIt.getStyle('padding-bottom'), 10);;
				this.showDragShim(draggable, 'TB');
			}.bind(this),
			onEnd: function(draggable, event)
			{
				var y = event.pointerY() - parseInt(this.PopIt.getStyle('padding-bottom'), 10);
				this.height = this.PopIt.getHeight() + (this.origY - y);
				if (y < 10)
				{
					this.height += y;
					y = 10;
				}
				this.height -= parseInt(this.PopIt.getStyle('padding-bottom'), 10)
				y += parseInt(this.PopIt.getStyle('padding-bottom'), 10);
				
				var minHeight = parseInt(this.PopIt.getStyle('min-height'), 10)
				if (this.height < minHeight) 
				{
					var dif = minHeight - this.height;
					this.height = minHeight; 
					y -= dif; 
				}

				this.height += 'px';
				y += 'px';
								
				this.PopIt.setStyle(
				{
					top: y,
					height: this.height
				});
				this.topResizeDiv.setStyle(
				{
					bottom: '',
					top: ''
				});
				if (this.shim)			
				{
					this.shim.setStyle(
					{
						height: this.PopIt.getHeight() + 'px'
					});
				}
				
				this.rightResizeDiv.setStyle(
				{
					height: this.PopIt.getHeight() + 'px'
				});
				this.leftResizeDiv.setStyle(
				{
					height: this.PopIt.getHeight() + 'px'
				});
				
				this.origY = null;
				this.hideDragShim(draggable);
			}.bind(this)
		});
		
		this.rightResizeDrag = new Draggable(this.rightResizeDiv, 
		{
			constraint: 'horizontal',
			onStart: function(draggable, event)
			{
				this.origX = event.pointerX();
				this.showDragShim(draggable, 'LR');
			}.bind(this),
			onEnd: function(draggable, event)
			{
				var x = event.pointerX();
				this.width = this.PopIt.getWidth() + (x - this.origX);
				var parentWidth = this.parent.getWidth() - 10;
				if (x > parentWidth)
				{
					var sub = (parentWidth - x);
					x += sub;
					this.width += sub;
				}
				var minWidth = parseInt(this.PopIt.getStyle('min-width'), 10)
				if (this.width < minWidth) 
				{
					var dif = minWidth - this.width;
					this.width = minWidth; 
					x -= dif; 
				}
								
				this.width += 'px';
				x += 'px';


				this.PopIt.setStyle(
				{
					right: x,
					width: this.width
				});
				this.rightResizeDiv.setStyle(
				{
					left: '',
					right: ''
				});
				
				this.origX = null;
				this.hideDragShim(draggable);
			}.bind(this)
		});
		
		this.bottomResizeDrag = new Draggable(this.bottomResizeDiv, 
		{
			constraint: 'vertical',
			onStart: function(draggable, event)
			{
				this.origY = event.pointerY() - this.scrollElement.scrollTop;
				this.showDragShim(draggable, 'TB');
			}.bind(this),
			onEnd: function(draggable, event)
			{
				var y = event.pointerY() - this.scrollElement.scrollTop;
				this.height = this.PopIt.getHeight() + (y - this.origY);
				
				var parentHeight = this.parent.getHeight() - 10;
				if (y > parentHeight)
				{
					var sub = parentHeight - y; 
					y += sub;
					this.height += sub;
				}
				this.height -= parseInt(this.PopIt.getStyle('padding-bottom'), 10);
				
				var minHeight = parseInt(this.PopIt.getStyle('min-height'), 10)
				if (this.height < minHeight) 
				{
					var dif = minHeight - this.height;
					this.height = minHeight; 
					y -= dif; 
				}
				
				
				this.height += 'px';
				y += 'px';
				
				this.PopIt.setStyle(
				{
					height: this.height
				});
				this.bottomResizeDiv.setStyle(
				{
					bottom: '',
					top: ''
				});
				
				if (this.shim)			
				{
					this.shim.setStyle(
					{
						height: this.PopIt.getHeight() + 'px'
					});
				}
				this.rightResizeDiv.setStyle(
				{
					height: this.PopIt.getHeight() + 'px'
				});
				this.leftResizeDiv.setStyle(
				{
					height: this.PopIt.getHeight() + 'px'
				});
				
				this.origY = null;
				this.hideDragShim(draggable);
			}.bind(this)
		});
		
		
		this.leftResizeDrag = new Draggable(this.leftResizeDiv, 
		{
			constraint: 'horizontal',
			onStart: function(draggable, event)
			{
				this.origX = event.pointerX();
				this.showDragShim(draggable, 'LR');
			}.bind(this),
			onEnd: function(draggable, event)
			{
				var x = event.pointerX();
				this.width = this.PopIt.getWidth() + (this.origX - x);
				if (x < 10)
				{
					this.width += x - 10;
					x = 10;
				}
				var minWidth = parseInt(this.PopIt.getStyle('min-width'), 10)
				if (this.width < minWidth) 
				{
					var dif = minWidth - this.width;
					this.width = minWidth; 
					x -= dif; 
				}
				
				this.width += 'px';
				x += 'px';
				this.PopIt.setStyle(
				{
					left: x,
					width: this.width
				});
				this.leftResizeDiv.setStyle(
				{
					right: '',
					left: ''
				});
				
				this.origX = null;
				this.hideDragShim(draggable);
			}.bind(this)
		});
	},

	createShim: function()
	{
		if (!this.shim)
		{
			this.shim = new Element('div', 
			{
				className: 'shim'
			}).setStyle(
				{
					height: this.PopIt.getHeight() + 'px',
					opacity: this.shimOpacity
				});
		}
	},	
	showDragShim: function(draggable, LRTB)
	{
		this.createShim();
		this.PopIt.insert(this.shim)
		draggable.element.addClassName('resizing' + LRTB);
		this.shim.show();
	},
	
	hideDragShim: function(draggable)
	{
		draggable.element.removeClassName('resizingLR');
		draggable.element.removeClassName('resizingTB');
		this.shim.hide();
	},
    
    generatePopIt: function()
    {
		this.PopIt = new Element('div',
		{
			className: this.className
		}).setStyle(
			{
				top: (this.scrollElement.scrollTop + this.offsetTop) + 'px',
				width: this.width,
				height: this.height
			});
		this.generateTitleBar()
		this.generateContentDiv();
		this.generateStatusBarDiv();			
		
		if (this.isModal) 
		{
			this.modalShim = new Element('div', 
			{
				className: 'ModalShim'
			}).setStyle(
			{
				height: this.scrollElement.scrollHeight + 'px',
				opacity: this.shimOpacity
			});
			this.modalShim.hide();
			this.parent.insert(this.modalShim);
			new Effect.Appear(this.modalShim, 
			{
				from: 0, 
				to: this.shimOpacity,
				duration: this.effectDuration
			});
		}
		this.PopIt.hide();
		this.parent.insert(this.PopIt);
		this.center();
		this.generateResizeElements();	
		new Effect.Appear(this.PopIt, 
		{
			duration: this.effectDuration
		});
		
		
		this.refreshDragDrop();
    },
	
	center: function()
	{
		var left = this.parent.getWidth() / 2;
		left = left - (this.PopIt.getWidth() / 2);
		left += 'px';
		
		this.PopIt.setStyle(
		{
			left: left
		});
	},
	
	generateResizeElements: function()
	{
		if (this.isDraggable) 
		{
			this.titleBarDiv.setStyle(
			{
				cursor: 'move'
			});
		}
		if (!this.isResizable)
		{
			return;
		}
		
		this.topResizeDiv = new Element('div', 
		{
			className: 'topResize'
		});
		this.PopIt.insert(this.topResizeDiv);
		
		this.rightResizeDiv = new Element('div', 
		{
			className: 'rightResize'
		});
		this.PopIt.insert(this.rightResizeDiv);

		this.bottomResizeDiv = new Element('div', 
		{
			className: 'bottomResize'
		});
		this.PopIt.insert(this.bottomResizeDiv);
		
		this.leftResizeDiv = new Element('div', 
		{
			className: 'leftResize'
		});
		
		this.rightResizeDiv.setStyle(
		{
			height: this.PopIt.getHeight() + 'px'
		});
		this.leftResizeDiv.setStyle(
		{
			height: this.PopIt.getHeight() + 'px'
		});
		
		this.PopIt.insert(this.leftResizeDiv);
	},
	
	generateTitleBar: function()
	{
		this.titleBarDiv = 	new Element('div',
		{
			className: 'TitleBar'
		});

		if (this.isMaximizable) 
		{
			this.titleBarDiv.observe('dblclick', this.maximize.bindAsEventListener(this));
		}
				
		var controlsDiv = new Element('div',
		{
			className: 'Controls'
		});

		if (this.isMinimizable) 
		{
			this.minimizeButton = new Element('div', 
			{
				className: 'minimizeButton'
			}).observe('click', this.minimize.bindAsEventListener(this));
			controlsDiv.insert(this.minimizeButton);
		}
		
		if (this.isMaximizable) 
		{
			this.maximizeButton = new Element('div', 
			{
				className: 'maximizeButton'
			}).observe('click', this.maximize.bindAsEventListener(this));
			controlsDiv.insert(this.maximizeButton);
		}
		
		if (this.isClosable) 
		{
			this.closeButton = new Element('div', 
			{
				className: 'closeButton'
			}).observe('click', this.close.bindAsEventListener(this));
			controlsDiv.insert(this.closeButton);
		}
		
		this.titleBarDiv.insert(controlsDiv);
					
		this.titleBarDiv.insert(this.title);
		
		this.PopIt.insert(this.titleBarDiv);
	},
	
	generateContentDiv: function()
	{
		if (this.isUrl)
		{
			this.content = new Element('iframe', 
			{
				frameborder: 0, //required for ie
				className: 'ContentIFrame',
				src: this.content
			});
		}
		
		this.contentDiv = new Element('div',
		{
			className: 'Content'
		}).update(this.content);
		
		if (this.isUrl)
		{
			this.contentDiv.setStyle(
			{
				padding: '0'
			});
		}
		
		this.PopIt.insert(this.contentDiv);
	},
	
	generateStatusBarDiv: function()
	{
		this.statusBarDiv = new Element('div', 
		{
			className: 'Status'
		});
		
		this.PopIt.insert(this.statusBarDiv);
	},
	
	minimize: function(event)
	{
		event.stop();
		this.isMinimized = !this.isMinimized;
		
		if (this.isMinimized)
		{
            this.PopIt.setStyle(
			{
				minHeight: '0'
			});
			new Effect.Morph(this.PopIt, 
            {
                style: 
                {
                    height: '0px'
                },
				duration: this.effectDuration
            });
		}
		else
		{
			var height = this.height;
			if (this.isMaximized)
			{
				height = (this.parent.getHeight() - 5) + 'px'
			}
			new Effect.Morph(this.PopIt,
			{
				style:
				{
					height: height,
					minHeight: ''
				},
				duration: this.effectDuration
			});
			this.contentDiv.show();
			this.statusBarDiv.show();
		}
		
	},
	
	maximize: function(event)
	{
		event.stop();
		if (event.element().hasClassName('minimizeButton'))
		{
			return;
		}
		this.isMaximized = !this.isMaximized;
		this.isMinimized = true;//this will maximize the window into view gets toggled back in this.minimize();
		this.minimize(event);
		if (this.isMaximized) 
		{
			this.left = parseInt(this.PopIt.getStyle('left'), 10);
			this.top = parseInt(this.PopIt.getStyle('top'), 10);
			this.maximizeButton.addClassName('restoreButton');
			var popitPadding = parseInt(this.PopIt.getStyle('padding-bottom'), 10);
			new Effect.Morph(this.PopIt,
			{
				style:
				{
					left: '0px',
					top: this.scrollElement.scrollTop + 'px',
					width: (this.parent.getWidth() - 3) + 'px',
					height: (this.parent.getHeight() - popitPadding - 3) + 'px'
				},
				duration: this.effectDuration
			});
			if (this.isResizable) 
			{
				this.topResizeDiv.hide();
				this.rightResizeDiv.hide();
				this.bottomResizeDiv.hide();
				this.leftResizeDiv.hide();
			}
		}
		else 
		{
			this.maximizeButton.removeClassName('restoreButton');
			new Effect.Morph(this.PopIt,
			{
				style:
				{
					width: this.width,
					height: this.height,
					left: this.left + 'px',
					top: this.top + 'px'
				},
				duration: this.effectDuration
			});
			if (this.isResizable)
			{
				this.topResizeDiv.show();
				this.rightResizeDiv.show();
				this.bottomResizeDiv.show();
				this.leftResizeDiv.show();
			}
		}
	},
	
	close: function(event)
	{
		event.stop();
		if (this.modalShim) 
		{
			new Effect.Fade(this.modalShim,
			{
				duration: this.effectDuration
			});
		}
		if (this.shim)
		{
			this.shim.hide();
		}
		new Effect.Fade(this.PopIt, 
		{
			duration: this.effectDuration, 
			afterFinish: function()
			{
				this.destroy();
			}.bind(this)
			
		});
		
	},
	
	updateStatusText: function(text)
	{
		this.statusBarDiv.update(text);
	},
	
	destroy: function()
	{
		Event.stopObserving(window, 'resize', this.centerHandler);
		if (this.keyDownHandler) 
		{
			Event.stopObserving(window, 'keydown', this.keyDownHandler);
		}
		this.titleBarDiv.stopObserving();
		if (this.minimizeButton) 
		{
			this.minimizeButton.stopObserving();
		}
		if (this.maximizeButton) 
		{
			this.maximizeButton.stopObserving();
		}
		if (this.closeButton) 
		{
			this.closeButton.stopObserving();
		}
		
		if (this.titleDrag)
		{
			this.titleDrag.destroy();
		}
		if (this.topResizeDrag)
		{
			this.topResizeDrag.destroy();
		}
		if (this.rightResizeDrag)
		{
			this.rightResizeDrag.destroy();
		}
		if (this.bottomResizeDrag)
		{
			this.bottomResizeDrag.destroy();
		}
		if (this.leftResizeDrag)
		{
			this.leftResizeDrag.destroy();
		}

		if (this.modalShim && this.modalShim.parentNode) 
		{
			this.modalShim.remove();
		}

		if (this.PopIt && this.PopIt.parentNode) 
		{
			this.PopIt.remove();
		}
				
		if (this.shim && this.shim.parentNode)
		{
			this.shim.remove();
		}	
	}
	
};