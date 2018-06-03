# remote-browser

A lightweight extension that allows you to browse and edit remote files over SFTP.

## Features
* Explorer-like view of any directory on a remote machine
* Simple browsing interface separate from your current workspace.
* Edit files locally and automatically sync them on save.
* Supports multiple authentication modes.

## Usage
![Alt Text](https://raw.githubusercontent.com/supradeep95/remote-browser/master/demo/demo.gif)
* set `remoteBrowser.connectionOptions` in User Settings
* If passwordless auth is not available/not successful, you will be prompted for a password.


### Extension Commands
* `Connect`:  Connect to remote machine.
* `Disconnect`:  Disconnect from remote machine.
* `Change Path`:  Change root path on the remote machine. Default root is the User's $HOME.


### Extension Settings

* `remoteBrowser.connectionOptions`: supports a subset of ssh2:ConnectConfig opts from the [ssh2](https://github.com/mscdex/ssh2) library.
* `remoteBrowser.tmpFolder`: Temporary folder for storing downloaded files

See the User Settings file for more info.

## Notes
* The extenstion relies on [ssh2-sftp-client](https://github.com/jyu213/ssh2-sftp-client) for remote connections.
* Depending on your workflow, the extension is most effective when used along with an ssh client running in the terminal. Even better if you also use [remote-vscode](https://github.com/rafaelmaiolla/remote-vscode).

## Roadmap
* Tests
* More UI elements (Context-menu etc. )
* More robust error handling

## Release Notes

### 0.5.0

Initial release 

-----------------------------------------------------------------------------------------------------------
