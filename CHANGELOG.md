# Changelog

## 1.3.0 (28.04.2021)

Now it's a bit easier to distinguish items because:

1. Every item has a subtitle formed as “Page name → Root frame name”.

2. It's possible to search only on the current page using new shiny page filter.

Also there was a small bug which caused the document node occur in search results under “Unknown” section. Now it fixed.


## 1.2.1 (01.04.2021)

A bunch of bugfixes!

1. If you are the fastest cowboy of the Wild West, you might have encountered an error of non working Deep Search right 
   after Figma page load. Now it fixed.
   
2. Fixed saving focused items on popup reopen. 

3. Fixed Group Filter Escape press handling. Now it closes as it have to.

4. Fixed input field keypress handling when Group Filter is open. Now the input is disabled when Group Filter is open.

5. Fixed the error when picking groups in Group Filter with an empty input field showed “Nothing found” error.


## 1.2.0 (30.03.2021)

If you picked categories w/o items but there are ones with them, you will see a friendly notice that will
suggest you to search everywhere.

“Others...” group in Categories Filter is open by default if there is selected item inside it.

“Not found” message and loader indicator do not overlap each other anymore.


## 1.1.0 (29.03.2021)

There are some new features:

1. Extension icon is inactivated when the current page is not Figma.com.

2. Deep Search now has a progress bar.

3. Categories Filter has been added. It allows to filter results to show only selected groups.


And also some fixes:

1. Multiline item text & icon rendering has been fixed. Now they does not look “shifted”.

2. The gap between input and Deep Search button has been increased to prevent collapsing.

3. Fixed some styles (e.g. Deep Search button hover color, etc).


## 1.0.0 (22.03.2021)

First release!

Everything was redesigned. Nothing was removed. Groups were added to search results.

Some small bugs was fixed, such as showing “Try Deep Search” or empty notice when nothing entered. 


## 0.7.0 (12.03.2021)

Now previously selected item is selected again when popup is reopen.

Also fixed the bug when new search results didn't trigger scroll position reset.


## 0.6.0 (11.03.2021)

Fixed deep search marking as done. Now the button disappears only when repeated search request has been sent.

Made the extension work with Firefox Nightly & Developer Edition on a regular basic. 
Previously it was possible to use it as a temporary add-on only.


## 0.5.0 (10.03.2021)

Search results sorting was improved. Not it's easier to find more valuable items: pages, frames, components, etc.

Input value will be selected when user reopens the popup.

Fixed deep search for rare case when it's activated on a first page, which is empty.


## 0.4.0 (08.03.2021)

Added Firefox support.

Added state caching. 

Fixed shortcut registration.


## 0.3.0 (07.03.2021)

Added icons for found items to make them more recognizable.

Added “Not found” notice, which shows when, well, nothing has been found.

Now search results are sorted by substring position and “importance”. 

Added “deep search”.

Fixed shortcut. Now the extension may be fired by pressing “Alt+Shift+F”.

Added keyboard navigation for the list of found items.


## 0.2.0 (06.03.2021)

Added preloader for time consuming searches. And added node selecting after focusing on it. 


## 0.1.0 (05.03.2021)

Init version.
