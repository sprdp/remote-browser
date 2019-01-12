# Change Log
All notable changes to the "remote-browser" extension will be documented in this file.

### 0.7
* Bottom status bar now displays file saving status.
* Added a defaultPath option which specifies a default directory to cd into on initial connect.

### 0.6
* Added support for multiple connections.
* Fixed issue of password prompt being undismissable.
* Fixed issue of files of the same name in different folders being considered the same.

### 0.5.6
* Bug fixes. Thanks to @ronsano

### 0.5.5
* Adds large file support. Thanks to @kimulimuli

### 0.5.3
* Added a default sort - Folders first and alphabetical.
* Added a filter option that allows filtering the current root folder by specifying a regex to test all filenames for. Might change this to a glob in the future.

### 0.5.2

* Added context menu option - Make root (Use on any subdirectory to make it the new root for the explorer tree)
* Fixed Bug where the '..'back option wasn't getting updated on root change.

### 0.5.1

* Changed privateKey connection option to be a file path instead of an actual key string.
* Fixed config file not being read after initialization.

### 0.5.0

Initial release 