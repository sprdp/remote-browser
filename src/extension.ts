'use strict';
import * as vscode from 'vscode';
import { logError, displayError, displayNotif } from './Common';
import {ConnConfig} from './ConnConfig';

import { RemoteFileTreeProvider } from './RemoteFileTreeProvider';

// Quick pick item
class QPItem implements vscode.QuickPickItem {
    public label: string;
    public config: ConnConfig;
    constructor(config: ConnConfig) {
        this.label = config.username + '@' + config.host;
        this.config = config;
    }
}

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

        let hosts: QPItem[] = [];
        let remoteBrowserConnectionOptions: any = config.get('remoteBrowser.connectionOptions');
        let additionalConnections: Array<any> | undefined = config.get('remoteBrowser.additionalConnections');

        if(additionalConnections && additionalConnections.length > 0) {
            // Show quick pick if additional connections are configured
            hosts.push(new QPItem(remoteBrowserConnectionOptions));
            additionalConnections.forEach((connectConfig: ConnConfig) => {
                hosts.push(new QPItem(connectConfig));
            });
            vscode.window.showQuickPick(hosts, {placeHolder: 'Select Configured connection'}).then(qp => {
                if(qp) {
                    remoteTree.connect(config, qp.config);
                }
            });
        }
        else {
            remoteTree.connect(config, remoteBrowserConnectionOptions);
        }
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