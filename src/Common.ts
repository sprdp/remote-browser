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