'use strict';
import * as vscode from 'vscode';
import { logError, displayError, displayNotif } from './Common';
import * as ssh2 from 'ssh2';


import { RemoteFileTreeProvider } from './RemoteFileTreeProvider';


export function activate(context: vscode.ExtensionContext) {
    let config = vscode.workspace.getConfiguration('');
    let remoteTree: RemoteFileTreeProvider = new RemoteFileTreeProvider(config);

    context.subscriptions.push(vscode.commands.registerCommand('remoteBrowser.disconnect', () => {
        remoteTree.endSession()
            .then(() => displayNotif('Disconnected'))
            .catch((e) => {
                displayError('Could not Disconnect');
                logError(e);
            });
    }));
    console.log('remote-browser is now active');

    // Register Connect Command
    let connCmd = vscode.commands.registerCommand('remoteBrowser.connect', () => {

        // Config may change
        config = vscode.workspace.getConfiguration('');

        let hosts: string[] = [];
        let remoteBrowserConnectionOptions: any = config.get('remoteBrowser.connectionOptions');

        // Get all configured hosts and show in QuickPick
        remoteBrowserConnectionOptions.forEach((connectConfig: ssh2.ConnectConfig) => {
            hosts.push(connectConfig.host!);
        });

        vscode.window.showQuickPick(hosts, {placeHolder: 'Select Target Host'}).then(p => {

            // Get configuration for selected host and pass to remoteTree.connect
            remoteBrowserConnectionOptions.forEach((connectConfig: ssh2.ConnectConfig) => {
                if (p === connectConfig.host) {
                    remoteTree.connect(config, connectConfig);
                }
            });
        });
    });

    // Register Path change Command
    let cpCmd = vscode.commands.registerCommand("remoteBrowser.changePath", (path: string) => {
        // If command is invoked by user, prompt for path
        if (!path) {
            vscode.window.showInputBox({ placeHolder: 'Enter Absolute Remote Path' }).then(p => {
                remoteTree.changePath(p ? p : '.');
            });
        }
        else {
            remoteTree.changePath(path);
        }

    });

    // Register Path change Command
    let opCmd = vscode.commands.registerCommand("remoteBrowser.openFile", (path: string) => {
        remoteTree.getFile(path);
    });

    // Register filter
    context.subscriptions.push(vscode.commands.registerCommand("remoteBrowser.filter", () => {
        vscode.window.showInputBox({ placeHolder: 'Enter Filter Regex. Leave blank to clear filter' }).then(p => {
            remoteTree.filter(p);
        });
    }));

    // Register makeRoot
    context.subscriptions.push(vscode.commands.registerCommand("remoteBrowser.makeRoot", (node: any) => {
        if(node) {
            // If target is a file, route to parent directory of the file
            remoteTree.changePath(node.isDir ? node.remotePath : node.parent.remotePath);
        }
        
    }));

    context.subscriptions.push(cpCmd);
    context.subscriptions.push(opCmd);
    context.subscriptions.push(connCmd);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('remoteExplorer', remoteTree));

}

export function deactivate() {

}