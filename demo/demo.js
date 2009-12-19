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


document.observe("dom:loaded", function()
{
	
	$('simplePopIt').observe('click', function(event)
	{
		event.stop();
		var popIt = new PopIt('simple PopIt');
	});
	
	$('callbackPopit').observe('click', function(event)
	{
		event.stop();
		new PopIt('simple PopIt', 
		{
			beforeShow: function()
			{
				alert('beforeShow');
			},
			afterShow: function()
			{
				alert('afterShow');
			},
			beforeClose: function()
			{ 
				alert('beforeClose');
			}, 
			afterClose: function()
			{
				alert('afterClose');
			},
			className: $('themeSelect').value
		});
	});
		
	$('loremIpsumLink').observe("click", function(event)
	{
		event.stop();
		var popIt = new PopIt($('lorem').innerHTML, 
		{
			title: 'Lorem ipsum',
			height: 400,
			width: 600, 
			className: $('themeSelect').value
		});
		
		popIt.updateStatusText("lorem ipsum");
	});
	
	$('modelLoremIpsumLink').observe("click", function(event)
	{
		event.stop();
		var popIt = new PopIt($('lorem').innerHTML, 
		{
			title: 'Lorem ipsum',
			height: 200,
			width: 300,
			isModal: true,
			isDraggable: false,
			isResizable: false,
			className: $('themeSelect').value
		});
		
		popIt.updateStatusText("lorem ipsum");
	});
	
	$('additionalClosePopIt').observe('click', function(event)
	{
		event.stop();
		var popIt = new PopIt('', 
		{
			id: 'myPopit'
		});
		//the content can come from anywhere i am just hard coding it for additional demonstration.
		var closeButton = new Element('input', 
		{
			type: 'button',
			value: 'close'
		});
		popIt.contentDiv.update();
		popIt.contentDiv.insert(closeButton);
		
		closeButton.observe('click', function(event)
		{
			event.stop();
			popIts.activePopIts['myPopit'].close();//active popits is an object with all the open popits by id
			
			//if you dont have access to the id you can locate it on the popit window.
			//event.element.up('.popIt').id would get it for you.
			
		});
		
		var closeAllButton = new Element('input', 
		{
			type: 'button',
			value: 'close all'
		});
		
		popIt.contentDiv.insert(closeAllButton);
		closeAllButton.observe('click', popIts.closeAll);
	});
	
	$('customLink').observe("click", customLinkClick);
	$('customLinkForm').observe('submit', customLinkClick);
		
	function customLinkClick(event)
	{
		event.stop();
		var url = $('customLinkInput').value;

		if (!url.startsWith('http://')) 
		{
			url = 'http://' + url;
		}
		var popIt = new PopIt(url, 
		{
			isUrl: true,
			width: 800,
			height: 400, 			
			className: $('themeSelect').value
		});
		
	}
});
	
