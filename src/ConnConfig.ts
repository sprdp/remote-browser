import * as ssh2 from 'ssh2';

// Extension of ssh2.ConnectConfig
export interface ConnConfig extends ssh2.ConnectConfig {
    defaultPath?: string;
}

