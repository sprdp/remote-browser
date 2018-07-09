import * as sftpclient from 'ssh2-sftp-client';
import * as ssh2 from 'ssh2';
import { FileNode } from './FileNode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { logError, displayError, displayNotif } from './Common';


export enum ConnectionStatus {
    Off,
    Connected,
    Disconnected
}


// Abstraction over ssh2-sftp-client
export class RemoteConnection extends sftpclient {

    connection: Promise<void>;
    filter?: RegExp | undefined;
    config: vscode.WorkspaceConfiguration;
    // An event to fire after the connection is successful
    event?: vscode.EventEmitter<FileNode | null | undefined>;
    connStatus: ConnectionStatus = ConnectionStatus.Off;

    constructor(config: vscode.WorkspaceConfiguration, event?: vscode.EventEmitter<FileNode | null | undefined>) {
        super();
        this.config = config;
        this.event = event;
        this.connection = this.conn();
    }

    // Keep sftp session alive by sending dummy GET packets every 60 seconds
    private keepAlive() {
        setInterval(() => {
            if (this.connStatus === ConnectionStatus.Connected) {
                // The promise return value is useless.
                this.get('.').then(() => { }).catch((e) => { });
            }
        }, 60000);
    }

    private conn(): Promise<void> {

        // Config may change
        this.config = vscode.workspace.getConfiguration('');

        let self = this;
        // Obtain the private key buffer
        let pkPath = this.config.get<string>('remoteBrowser.connectionOptions.privateKey');
        let pkBuffer = pkPath ? fs.readFileSync(pkPath) : undefined;

        let connection_args: ssh2.ConnectConfig = {
            username: this.config.get<string>('remoteBrowser.connectionOptions.username'),
            host: this.config.get<string>('remoteBrowser.connectionOptions.host'),
            password: this.config.get<string>('remoteBrowser.connectionOptions.password'),
            port: this.config.get<number>('remoteBrowser.connectionOptions.port'),
            localHostname: this.config.get<string>('remoteBrowser.connectionOptions.localHostname'),
            localUsername: this.config.get<string>('remoteBrowser.connectionOptions.localUsername'),
            passphrase: this.config.get<string>('remoteBrowser.connectionOptions.passphrase'),
            privateKey: pkBuffer,
            agent: this.config.get<string>('remoteBrowser.connectionOptions.agent')
        };

        var connect_with_args = function (args: ssh2.ConnectConfig) {
            let connection = self.connect(connection_args).then((res) => {
                self.connStatus = ConnectionStatus.Connected;
                self.keepAlive();
                self.event ? self.event.fire() : {};
                displayNotif('Connected');
            }).catch((e) => {
                /* Check for an auth failure and prompt for password */
                if (e.level === 'client-authentication') {
                    vscode.window.showInputBox({ placeHolder: `Password for ${args.username}@${args.host}`, password: true }).then(pwd => {
                        args.password = pwd;
                        connect_with_args(args);
                    });
                }
                else {
                    displayError('Error in connection. Check console for details');
                    logError(e);
                }

            });
            return connection;
        }

        return connect_with_args(connection_args);

    }

    public setFilter(regexQuery: string | undefined) {
        try {
            this.filter = regexQuery ? new RegExp(regexQuery) : undefined;
        }
        catch (e) {
            logError(e);
            displayError('Regex Error');
        }
    }



    /* sftp-ls on directory path*/
    public async get_list(dirPath?: FileNode) {
        let file_list: Array<sftpclient.FileInfo> = [];
        try {
            file_list = await this.list(dirPath ? dirPath.remotePath : '.');
        }
        catch (e) {
            logError(e);
            displayError('Error in obtaining directory contents');
        }
        return file_list.filter((a) => this.filter ? this.filter.test(a.name) : true)
            .sort((a, b) => {
                let name1 = a.name.toLowerCase(), name2 = b.name.toLowerCase();
                // Default Sort option - Alphabetical and Folders first
                if(a.type === 'd' && b.type !== 'd') {
                    return -1;
                }
                if(b.type === 'd' && a.type !== 'd') {
                    return 1;
                }
                if (name1 < name2) {
                    return -1;
                }
                if (name1 > name2) {
                    return 1;
                }
                return 0;
            })
            .map((elem) => {
                return new FileNode(elem.name, elem.type === 'd', dirPath);
            });
    }

    private get_local_dir() {
        let conf_dir = this.config.get<string>('remoteBrowser.tmpFolder');
        if (!conf_dir) {
            return os.tmpdir();
        }
        try {
            // Create directory if it does not exist
            if (!fs.existsSync(conf_dir)) {
                fs.mkdirSync(conf_dir);
            }
        } catch (e) {
            displayError('Error in obtaining local Directory. Make sure path is correct.');
            logError(e);
        }

        return conf_dir;
    }

    /* sftp-get on file path. Returns a local file path containing contents of remote file */
    public async get_file(remotePath: string) {
        var fileStream = null;
        const filename = remotePath.split('/').slice(-1)[0];
        const localFilePath = path.join(this.get_local_dir(), filename);

        // Remove local file if it exists before getting remote file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        try {
            // Create an empty file before append to handle empty chunks
            fs.closeSync(fs.openSync(localFilePath, 'w'));

            fileStream = (await this.get(remotePath));
            fileStream.on('data', (chunk: any) => {
                fs.appendFile(localFilePath, chunk, function (err) {
                    if (err) {
                        logError(err.message);
                        displayError('Error in Writing file to local path. Check console for details');
                    }
                });
            });
        }
        catch (e) {
            logError(e);
            displayError('Error in downloading file');
        }

        return localFilePath;
    }

    /* sftp-put on file path */
    public async put_file(remotePath: string, localPath: string) {

        this.put(localPath, remotePath, false, 'utf8').then((res) => {
            console.log('File saved to ' + remotePath);
        }).catch((err) => {
            displayError('Error in saving file to remote. Check console for details');
            logError(err);
        });
    }
}