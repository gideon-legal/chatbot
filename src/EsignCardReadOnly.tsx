import { DirectLineOptions } from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import { NodeHeader } from './nodes/containers/NodeHeader';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import { connect } from 'react-redux';

import { EsignNode, EsignPopup, EsignCheckMark } from './assets/icons/EsignIcons';
import { sendSignature } from './api/bot';
import { Hidden } from '@material-ui/core';
//will most likely need read only card too for after signing
export interface Node {
    node_type: string;
    document: any;
    meta: any;
    
}

export interface EsignCardReadOnlyProps {
    files: Array<{ name: string, url: string}>;
}

export class EsignCardReadOnly extends React.Component<EsignCardReadOnly, {}> {
    constructor(props: EsignCardReadOnly) {
        super(props);

        this.state = {
          showDisclaimer: false
        };
    }

    render() {
        return (
            <div>
                <div className="uploaded-files-container">
                <div className="uploaded-file-name-readonly-link">
                  {/*<a target="_blank" href={}>{"signed file"}</a>*/}
                 
                </div>

            </div>
            
            </div>
        )
    }
}



