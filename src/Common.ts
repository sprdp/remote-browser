import * as vscode from 'vscode';

export function logError(e: string) {
    console.error(`remote-browser ERROR: ${e}`);
}

export function displayError(e: string) {
    vscode.window.showErrorMessage(`remote-browser : ${e}`);
}

export function displayNotif(n: string) {
    vscode.window.showInformationMessage(`remote-browser : ${n}`);
}

export class StatusBarItem {
    myStatusBarItem: vscode.StatusBarItem;
    constructor() {
        this.myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.myStatusBarItem.color = new vscode.ThemeColor('statusBar.foreground');
    }
    updateStatusBarSuccess(message: string) {
        this.myStatusBarItem.color = new vscode.ThemeColor('statusBar.foreground');
        this.myStatusBarItem.text =  `$(megaphone) ` + message;
		this.myStatusBarItem.show();
    }
    updateStatusBarProgress(message: string) {
        this.myStatusBarItem.color = new vscode.ThemeColor('statusBar.debuggingBackground');
        this.myStatusBarItem.text = message;
		this.myStatusBarItem.show();
    }
    dispose() {
        this.myStatusBarItem.dispose();
    }
    hide() {
        this.myStatusBarItem.hide();
    }
}