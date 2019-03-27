# Crawler_BGPStream
A simple Javascript client-side crawler to webscraping BGPStream.com with some extra functionalities.

## Basic setup

There are 3 known possible usage for this software, in some case there are limitations.

You can:
* Use nodejs server for hosting the page application
  * Eg: node server.js 
  * Best choice
* Use nodejs http-server, or any other, for hosting http page
  * Eg: http-server index.html
* Open the page in the browser as a local file 
  * with limitations: no web cache (localStorage) is available for data caching

## Use and Motivation

The tool "translates" the events shown on the BGPStream.com webpage producing a table of cases which also contains the URL for the visualization of the event using the RIPE analysis tool  *UpstreamVisibility*.

Check https://stat.ripe.net/widget/upstream-visibility

For short, it will be produce a valid UpstreamVisibility URL, already configured with valid *starttime* *endtime* and *resource* fields, taken from the BGPStream.com event.

## UI Workflow & Usage

The application allow the following functionalities, following the given workflow
### 1. Cache Managment

##### 1.1 Restore 
Optionally the user can restore previous data session by clicking on "Load Cache" button. If the cache is empty no changes occurs. 
 
##### 1.2 Clear 
Alternatively if the users want to start a brand new session, use the "Clear Local Cache" button to flush the cache. (See Saving & Restore Data for furhter informations).
 
### 2. Data Fetching

At least one time per session, new data must be fetched from the BGPStream.com page.
 The user then must click on the "Fetch from BGPStrem.com" button and wait for data fetching.
 Then the application load the list of events shown on the mainpage, if the cache was previously loaded, already cached events are dropped.

### 3 Update

After fetching new data, the user can update the current cache by pressing "Update from BGPStream.com".
 The crawler will start checking, event by event, applying the following procedure
  
* the "detail" page of the event is collected
* if the page contains at least the minimum requirements of information needed, it will be processed, otherwise the event is discarded.
* the minimum requirements needed are
  * The "leaked IP prefix" or the AS number of involved AS in the issue.
  * The start time of the event. 
* Optionally, if no end time field is found, the end time is set equals to the start time.
* The start time will be decremented of -1 Day.
* The end time will be incremented of +1 Day.
* If an ASN is found insted of an IP prefix, then the ASN will be resolved as the greatest subnet which the ASN holds.

Once the event is processed it will be added to the cache and also pushed in the events table.
The process continues until all events are processed or until the button "Update from BGPStream.com" is pressed again.

The user can choice to pause and continue the process at will just by pressing the update button.

NOTES:
+ if the crawling step fails due to connectivity problems the crawler will retry 3 times before givin up to the next event.
+ if the page doens't contains usefull information the event will be added to a skip list to avoid crawling in the following sessions, if cache is not cleared.

## Saving & Restoring Data

All the data needed for the session are stored under two objects of localStorage with the following structure:

localStorage['skiplist']
* a list of the eventid to be skipped
* eg: [1923,11292,141,...]

localStorage['stored_collection']
* an object indexed by eventid key, each containing an object with the following fiels
 * type: the event type such as (Outage, Leak, Hijack)
 * starttime: the start time
 * endtime: the end time
 * bgpstreamlink: the original BGPStream.com URL
 * target: the given  IP prefix
 
The user can save those two variables and then use the * restore_cache.js * to manually restore the data.
Edit the first two variables of the js script to set the cached data.
Then just copy and paste in the browser js console the code.
