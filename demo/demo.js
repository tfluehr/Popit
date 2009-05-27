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
	$('loremIpsumLink').observe("click", function(event)
	{
		event.stop();
		var popIt = new PopIt($('lorem').innerHTML, 
		{
			title: 'Lorem ipsum',
			height: '400px',
			width: '600px',
		});
		
		popIt.updateStatusText("lorem ipsum");
	});
	
	$('modelLoremIpsumLink').observe("click", function(event)
	{
		event.stop();
		var popIt = new PopIt($('lorem').innerHTML, 
		{
			title: 'Lorem ipsum',
			height: '200px',
			width: '300px',
			isModal: true,
			isDraggable: false,
			isResizable: false
		});
		
		popIt.updateStatusText("lorem ipsum");
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
			width: '80%',
			height: '80%'
		});
		
	}
});
	
