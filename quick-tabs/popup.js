/*
 Copyright (c) 2009 - 2014, Evan Jehu
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 * Neither the name of the author nor the
 names of its contributors may be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL EVAN JEHU BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var bg = chrome.extension.getBackgroundPage();
var LOG_SRC = "popup";
var searchStr = "";

// Simple little timer class to help with optimizations
function Timer(src) {
  this.src = src;
  this.start = (new Date).getTime();
  this.last = this.start;
}
Timer.prototype.log = function(id) {
  var now = (new Date).getTime();
  bg.log(this.src, id + " total time " + (now - this.start) + " m/s, delta " + (now - this.last) + " m/s");
  this.last = now;
};

function tabImage(tab) {
  if(tab.favIconUrl && tab.favIconUrl.length > 0) {
    return tab.favIconUrl;
  } else if(/^chrome:\/\/extensions\/.*/.exec(tab.url)) {
    return "/assets/chrome-extensions-icon.png";
  } else {
    return "/assets/blank.png"
  }
}

function openInNewTab(url) {
  chrome.tabs.create({url:url, index:1000});
  window.close();
}

function closeTabs(tabIds) {
  bg.recordTabsRemoved(tabIds, function() {
    for(var x = 0; x < tabIds.length; x++) {
      var tabId = tabIds[x];
      chrome.tabs.remove(tabId);
      $("#" + tabId).fadeOut("fast").remove();
    }
    $('.tab.closed').remove();
    drawClosedTabs();
  })
}

function scrollToFocus(offset) {
  $('.content').stop().scrollTo('.withfocus', 100, {offset:{top:offset, left:0}});
}

function focus(elem) {
  $(".tab.withfocus").removeClass('withfocus');
  elem.addClass('withfocus');
}

function tabsWithFocus() {
  return $(".tab.withfocus:visible");
}

function isFocusSet() {
  return tabsWithFocus().length > 0;
}

function focusFirst() {
  return $(".tab:visible:first").addClass("withfocus");
}

function focusLast() {
  return $(".tab:visible:last").addClass("withfocus");
}

function focusPrev(skip) {
  skip = skip || 1;
  tabsWithFocus().removeClass('withfocus').prevAll(":visible").eq(skip - 1).addClass('withfocus');
  if(!isFocusSet()) {
    (skip == 1 ? focusLast : focusFirst)();
  }
  scrollToFocus(-56);
}

function focusNext(skip) {
  skip = skip || 1;
  tabsWithFocus().removeClass('withfocus').nextAll(":visible").eq(skip - 1).addClass('withfocus');
  if(!isFocusSet()) {
    (skip == 1 ? focusFirst : focusLast)();
  }
  scrollToFocus(-394);
}

/**
 * The following piece of code was copied from https://github.com/olado/doT/blob/master/doT.js
 * DoT needs this prototype extension in order to encode HTML code inside "{{! }}".
 * @copyright Laura Doktorova, 2011
 */
function encodeHTMLSource() {
  var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;' },
      matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;
  return function() {
    return this ? this.replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : this;
  };
}
String.prototype.encodeHTML = encodeHTMLSource();

/**
 * Uncomment the doT.js code below and update the permissions in the manifest file to allow string execution.
 *
 * "content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'",
 *
 * bg.template_cache = doT.template($('#template').html());
 *
 * see https://github.com/olado/doT
 *
 * The function anonymous was generated by copying the template code from popup.html into the template area
 * here http://olado.github.io/doT/ and then copy the generated function.  Doing this speeds things along and
 * avoids changing the extensions required permissions.
 */
function drawCurrentTabs(template) {
  // find the available tabs
  if(!bg.template_cache) {
// uncomment this to use the doT.js
//    bg.template_cache = doT.template($('#template').html());
    bg.template_cache =
            function anonymous(it /**/) { var out=' ';var arr1=it.tabs;if(arr1){var tab,index=-1,l1=arr1.length-1;while(index<l1){tab=arr1[index+=1];out+=' ';if(index === 0){out+=' ';}else if(true){out+=' <div class="tab open '+(it.urlStyle);if(index === 1){out+=' withfocus';}out+='" id="'+(tab.id)+'" window="'+(tab.windowId)+'"> <div class="'+(it.tabImageStyle)+'"> <img src="'+(tabImage(tab))+'" width="16" height="16" border="0"> </div> <div> <div class="close" id="c'+(tab.id)+'"><img src="assets/close.png" title="'+(it.closeTitle)+'"></div> <div class="title hilite"';if(it.tips){out+=' title="'+(tab.title||'').toString().encodeHTML()+'"';}out+='>'+(tab.title||'').toString().encodeHTML()+'</div> ';if(it.urls){out+='<div class="url hilite">'+(tab.url)+'</div>';}out+=' </div> </div> ';}out+=' ';} } out+=' ';var arr2=it.closedTabs;if(arr2){var tab,index=-1,l2=arr2.length-1;while(index<l2){tab=arr2[index+=1];out+=' <div class="tab closed '+(it.urlStyle)+'" id="x'+(index)+'" window="'+(tab.windowId)+'"> <div class="'+(it.tabImageStyle)+'"> <img src="'+(tabImage(tab))+'" width="16" height="16" border="0"> </div> <div> <div class="close" id="c'+(tab.id)+'"><img src="assets/close.png" title="'+(it.closeTitle)+'"></div> <div class="title hilite"';if(it.tips){out+=' title="'+(tab.title)+'"';}out+='>'+(tab.title)+'</div> ';if(it.urls){out+='<div class="url hilite">'+(tab.url)+'</div>';}out+=' </div> </div> ';} } return out; };
  }

  var out = bg.template_cache({
    'tabs': bg.tabs,
    'closedTabs': bg.closedTabs,
    'closeTitle': "close tab (" + bg.getCloseTabKey().pattern() + ")",
    'tabImageStyle': bg.showFavicons() ? "tabimage" : "tabimage hideicon",
    'urlStyle': bg.showUrls() ? "" : "nourl",
    'urls': bg.showUrls(),
    'tips': bg.showTooltips()
  });

  template.html(out);

  $('.tab.open').on('click', function() {
    bg.switchTabs(parseInt(this.id), function() {
      window.close();
    });
  });

  $('.tab.closed').on('click', function() {
    var i = parseInt(this.id.substring(1));
    // create a new tab for the window
    openInNewTab(bg.closedTabs[i].url);
    // remove the tab from the closed tabs list
    bg.closedTabs.splice(i, 1);
  });

  $('.tab').on('mouseover', function () {
    focus($(this));
  });

  $('.close').on('click', function() {closeTabs([parseInt(this.id.substring(1))])});

}

$(document).ready(function() {

  var timer = new Timer(LOG_SRC);

  // verify that the open tabs list is correct
  bg.checkOpenTabs(true);

  // the timeout seems to improve the loading time significantly
  setTimeout(function () {
    // load the tab table
    var template = $(".template");
    drawCurrentTabs(template);

    $('#searchbox').quicksearch('.tab', {
      delay: 50,
      onAfter: function () {
        if (bg.swallowSpruriousOnAfter) {
          bg.swallowSpruriousOnAfter = false;
          return;
        }
        // update the highlighting
        var str = $("input[type=text]").val();
        // If the search string hasn't changed, the keypress wasn't a character
        // but some form of navigation, so we can stop.
        if (searchStr == str) return;
        searchStr = str;

        var hilite = $(".hilite");
        hilite.removeHighlight();
        if (str.length > 0) {
          hilite.highlight(str);
        }
        // Put the ones with title matches on top, url matches after
        var in_title = $('div.tab:visible:has(.title>.highlight)'),
                in_url = $('div.tab:visible:not(:has(.title>.highlight))');
        if (in_title && in_url) {
          $('div.template').prepend(in_title, in_url);
        }
        // update the selected item
        $(".tab.withfocus").removeClass("withfocus");
        focusFirst();
      }
    });
    timer.log("Template ready");
  }, 0);

  $(document).bind('keydown.down', function() {
    focusNext();
    return false;
  });

  $(document).bind('keydown.up', function() {
    focusPrev();
    return false;
  });

  $(document).bind('keydown.tab', function() {
    focusNext();
    return false;
  });

  $(document).bind('keydown.shift_tab', function() {
    focusPrev();
    return false;
  });

  (function(skipSize) {
    $(document).bind('keydown.pagedown', function() {
      focusNext(skipSize);
    });

    $(document).bind('keydown.pageup', function() {
      focusPrev(skipSize);
    });
  }(bg.pageupPagedownSkipSize()));

  // Determine which next/previous style keybindings to use
  if (bg.nextPrevStyle() === 'ctrlj') {
    $(document).bind('keydown.ctrl_j', function () {
      bg.swallowSpruriousOnAfter = true;
      focusNext();
      return false;
    });
    $(document).bind('keydown.ctrl_k', function () {
      bg.swallowSpruriousOnAfter = true;
      focusPrev();
      return false;
    });
  } else {
    $(document).bind('keydown.ctrl_n', function () {
      bg.swallowSpruriousOnAfter = true;
      focusNext();
      return false;
    });
    $(document).bind('keydown.ctrl_p', function () {
      bg.swallowSpruriousOnAfter = true;
      focusPrev();
      return false;
    });
  }

  $(document).bind('keydown.return', function() {
    if(!isFocusSet()) {
      focusFirst();
    }
    if(isFocusSet()) {
      tabsWithFocus().trigger("click");
    } else {
      var inputText = $("input[type=text]");
      var url = inputText.val();
      if(!/^https?:\/\/.*/.exec(url)) {
        url = "http://" + url;
      }
      bg.log(LOG_SRC, "no tab selected, " + url);
      if (/^(http|https|ftp):\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?\/?([a-zA-Z0-9\-\._\?,'/\\\+&amp;%$#=~])*$/.exec(url)) {
        chrome.tabs.create({url: url});
      } else {
        //url = "http://www.google.com/search?q=" + encodeURI($("input[type=text]").val());
        url = bg.getSearchString().replace(/%s/g, encodeURI(inputText.val()));
        chrome.tabs.create({url: url});
        window.close();
      }
    }
    return false;
  });

  $(document).bind('keydown.' + bg.getCloseTabKey().pattern(), function() {
    bg.swallowSpruriousOnAfter = true;
    if(!isFocusSet()) {
      focusFirst();
    }
    var attr = tabsWithFocus().attr('id');
    if(attr) {
      var tabId = parseInt(attr);
      if ( tabsWithFocus().nextAll("div.open").length == 0 ) {
        focusPrev();
      } else {
        focusNext();
      }
      closeTabs([tabId]);
    }
    return false;
  });

  $(document).bind('keydown.' + bg.getCloseAllTabsKey().pattern(), function() {
    var tabids = [];
    $('.tab.open:visible').each(function () {
      tabids.push(parseInt($(this).attr('id')));
    });
    closeTabs(tabids);
    return false;
  });

  $(document).bind('keydown.esc', function() {
    window.close();
    return false;
  });

  timer.log("Document ready");

});
