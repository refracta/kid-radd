/*
 * Javascript for Kid Radd
 * 2012 Brad Greco <brad@bgreco.net>
 *
 * The old frame-based viwer no longer works at all in Google chrome,
 * so I rewrote it with a bit of Javascript and without frames.
 *
 * Keyboard-based navigation (left and right arrow keys) has also been added.
 */

$(document).ready(function() {
	$(window).bind('hashchange', hashchange);
	$(document).keydown(keypress);
	$('a[name]').addClass('panel');
	$('a[name="title"]').addClass('visible');
	if($('a[name="p1"]').length > 0)
		$('body').prepend('<div id="cover"></div>');
	if (document.cookie.indexOf("zoom=true") != -1 && document.URL.indexOf("comic") > -1 || document.URL.indexOf("flash601") > -1) {
		zoom();
	}
	hashchange();
	overrideSwapOut();
	if(shouldUsePrescaled())
		showPrescaled();
	overrideSwapOut();
});

// Should we use the prescaled images?
// Only if we're Webkit, and we don't support image-rendering: pixelated.
function shouldUsePrescaled() {
	return $.browser.webkit
	    && typeof CSS != 'undefined'
	    && typeof CSS.supports != 'undefined'
	    && !CSS.supports('image-rendering', 'pixelated')
}

// Autoplay entrie comic - for broken image checking
/*$(window).load(function() {
	setInterval(function() {
		link = find_link('next');
		link.mousedown();
		link.mouseup();
		link.click();
		window.location = link.attr('href');
	}, 2000);
});*/

// Position future frames off-screen instead of using display:none.
// It seems that browsers won't pre-load images that are set as the
// background of a <td> if the <td> is set to display:none.
function hashchange() {
	page = window.location.hash.replace('#', '');
	if(page) {
		$('.panel').removeClass('visible');
		$('a[name="' + page + '"]').addClass('visible');
		swapOutAll();
	}
}

function keypress(event) {
	if(event.keyCode == 39)
		var link = find_link('next');
	else if(event.keyCode == 37)
		var link = find_link('prev');
	if(link) {			// simulate a click so the comic's onclick will fire
		// Fire a bunch of events since different pages bind to different ones
		link.mousedown();
		link.mouseup();
		link.click();
		window.location = link.attr('href');
	}
}


function zoom() {
	if ($('body').hasClass('zoom')) {
		document.cookie = "zoom=; max-age=0; SameSite=Lax";
	} else {
		document.cookie = "zoom=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Lax";
	}
	$('body').toggleClass('zoom');
}

// Scan the page for the link corresponding to the given image by
// finding the correct image contained within the currently-visible panel.
function find_link(image) {
	var link = $('a.visible img[src="' + image + '.gif"]');
//	var link = $('img[src="' + image + '.gif"]:visible'); // can't do this now that we're not using display:none
	if(link.length != 1) {
		console.log('Could not determine link');
		return;
	}
	return link.parent();
}

//
function StartMusic(){
	$('#music').get(0).play();
}

function StopMusic(){
	$('#music').get(0).pause();
	$('#music').get(0).currentTime = 0;
}

// Attempt to force all GIFs to reset and play from the beginning.
// Called on every frame switch.
// For IE, force a complete re-download since it doesn't reset the play position even
// after resetting the src attribute (ugh). Slow, but better than no animation at all.
function swapOutAll() {
	var msie = navigator.userAgent.toLowerCase().indexOf('trident') > -1 || navigator.userAgent.toLowerCase().indexOf('msie') > -1;
	$('[name*="imageflip"]').each(function() {
		var src = $(this).attr('src');
		if(msie)
			src += '?' + (new Date).getTime();
		$(this).attr('src', 'spacer.gif');
		$(this).attr('src', src);
	});
}

// Sometimes, single-play GIFs don't reset to the beginning when they're swapped out using the old way.
// The best workaround I've found so far is to immediately swapp out all images when the page is loaded,
// then override the inline functions so they never get called again. Whenever the user changes panels,
// swapOutAll() gets called to reset all animations.
function overrideSwapOut() {
	if(window.SwapOut) {
		SwapOut();
		window.SwapOut = function() { return true; };
	}
	if(window.SwapOutb) {
		SwapOutb();
		window.SwapOutb = function() { return true; };
	}
	if(window.SwapOutc) {
		SwapOutc();
		window.SwapOutc = function() { return true; };
	}
	if(window.SwapOutd) {
		SwapOutd();
		window.SwapOutd = function() { return true; };
	}
	if(window.SwapOute) {
		SwapOute();
		window.SwapOute = function() { return true; };
	}
}

// Show pre-scaled images in Webkit
// because it is terrible and provides no way to scale images without blurring them.
// If they ever fix this (ha!) this function can be deleted, along with the
// endire prescaled/ directory.
function showPrescaled() {
	$('img:not(.preload)').each(function() {
		var w = $(this).attr('width');
		var h = $(this).attr('height');
		var src = $(this).attr('src').replace(/^http.*kidradd\//, '');
		if(w && h && src) {
			if(src == 'next.gif' || src == 'prev.gif' || src == 'spacer.gif' || src == 'raddlogo.gif')
				return;
			var newsrc = 'prescaled/' + w + 'x' + h + '_' + src;
			$(this).attr('src', newsrc);
		}
	});

	// Super ugly replacement of pre-loadable images
	// Preload images are created with inline Javascript.
	// Loop through every variable attached to the document and look at the Images.
	for(v in this) {
		if(this[v] instanceof Image) {
			var img = this[v];
			var src = img.getAttribute('src');
			if(src == 'spacer.gif')
				continue;

			// Dan sometimes got width and height confused in his Image constructors!
			// On the server side, we've generated pre-scaled images using the declared
			// width and height, as well as images with the dimensions reversed.
			// To try to figure out which one to load, look at every 'imageflip*' image
			// on the page and look for one with either the correct dimensions, or one
			// with the dimensions reversed.
			var claimed_w = img.width;
			var claimed_h = img.height;
			$('[name*="imageflip"]').each(function() {
				if($(this).attr('width') == claimed_w && $(this).attr('height') == claimed_h) {
					img.src = 'prescaled/' + img.width + 'x' + img.height + '_' + src;
				} else if($(this).attr('width') == claimed_h && $(this).attr('height') == claimed_w) {
					img.src = 'prescaled/' + img.height + 'x' + img.width + '_' + src;
				}
			});
		}
	}
}
