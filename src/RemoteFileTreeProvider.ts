import { TreeItem, TreeDataProvider } from "vscode";
import { RemoteConnection, ConnectionStatus } from './RemoteConnection';
import { FileNode } from './FileNode';
import * as vscode from 'vscode';
import {ConnConfig} from './ConnConfig';


export class RemoteFileTreeProvider implements TreeDataProvider<TreeItem> {
    

    private remoteConnection!: RemoteConnection;
    private config!: vscode.WorkspaceConfiguration;
    private root: FileNode = new FileNode('.', true, undefined);
    public _onDidChangeTreeData: vscode.EventEmitter<FileNode | null | undefined> = new vscode.EventEmitter<FileNode | null | undefined>();
    public readonly onDidChangeTreeData: vscode.Event<FileNode | null | undefined> = this._onDidChangeTreeData.event;


    constructor(config: vscode.WorkspaceConfiguration) {
    }



    public connect(config: vscode.WorkspaceConfiguration, connectConfig: ConnConfig) {
        var self = this;

        var onConnect = function() {
            if(connectConfig.defaultPath) {
                self.changePath(connectConfig.defaultPath);
            }
        }

        this.config = config;
        this.remoteConnection = new RemoteConnection(this.config, connectConfig, this._onDidChangeTreeData, onConnect);
       // var x = this.onDidChangeTreeData(onConnect);
    }


    public endSession() {
        return this.remoteConnection.end().then((res) => {
            this.remoteConnection.connStatus = ConnectionStatus.Disconnected;
            this.remoteConnection.statusBar.dispose();
            this._onDidChangeTreeData.fire();
        });
    }

    public changePath(path: string) {
        this.root = new FileNode(path, true, undefined);
        this._onDidChangeTreeData.fire();
    }

    public filter(query: string | undefined) {
        this.remoteConnection.setFilter(query);
        this._onDidChangeTreeData.fire();
    }

    public async getFile(remotePath: string) {
        try {
            await this.remoteConnection.connection;
            console.log("Obatined list");
        }
        catch (e) {
            console.log(e);
        }
        const localPath = await this.remoteConnection.get_file(remotePath);
        vscode.workspace.openTextDocument(localPath).then((textDocument: vscode.TextDocument) => {

            vscode.window.showTextDocument(textDocument, {preview: false}).then((textEditor: vscode.TextEditor) => {

                // Watch for file save
                vscode.workspace.onDidSaveTextDocument((doc: vscode.TextDocument) => {
                    if (doc === textDocument) {
                        this.remoteConnection.put_file(remotePath, localPath);
                    }
                });
            });
        });

    }

    public getTreeItem(element: FileNode) {
        return element;
    }

    public async getChildren(element?: FileNode): Promise<FileNode[]> {

        /* Handling connection promises gets iffy due to multiple failure and race conditions. 
           Instead, we wait for onDidChangeTreeData to be fired after a connection is successful
        */
        if(!this.remoteConnection) {
            return [];
        }

        if(this.remoteConnection.connStatus !== ConnectionStatus.Connected) {
            return [];
        }
        
        if (element) {
            return await this.remoteConnection.get_list(element);
        }
        // Add the back option only to the root element
        else {
            return [new FileNode('..', false, this.root)].concat(await this.remoteConnection.get_list(this.root));
        }

    }

}
