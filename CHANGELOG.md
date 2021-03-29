# Changelog

## 1.1.0 (29.03.2021)

There are some new features:

1. Extension icon is inactivated when the current page is not Figma.com.

2. Deep Search now has a progress bar.

3. Groups Filter has been added. It allows to filter results to show only selected groups.


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
