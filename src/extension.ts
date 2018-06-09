'use strict';
import * as vscode from 'vscode';
import { logError, displayError, displayNotif } from './Common';


import { RemoteFileTreeProvider } from './RemoteFileTreeProvider';


export function activate(context: vscode.ExtensionContext) {
    let connActivated = false;
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
        /*  remoteConnection is implicitly created on 
            first call to remoteBrowser.connect by RemoteFileTreeProvider's constructor.
            connActivated is required to ensure remoteTree.connect() is called only on subsequent calls.
            Hacky, I know. */
        if (connActivated) {
            remoteTree.connect();
        }
        connActivated = true;
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
            remoteTree.changePath(node.remotePath);
        }
        
    }));

    context.subscriptions.push(cpCmd);
    context.subscriptions.push(opCmd);
    context.subscriptions.push(connCmd);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('remoteExplorer', remoteTree));

}

export function deactivate() {

}