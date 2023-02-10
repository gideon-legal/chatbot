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
    files: Array<{ name: string, url: string }>;
}

export class EsignCardReadOnly extends React.Component<EsignCardReadOnlyProps, {}> {
    constructor(props: EsignCardReadOnlyProps) {
        super(props);

        console.log("check files")
        console.log(this.props.files)


        this.state = {
          showDisclaimer: false
        };
    }

    render() {
        return (
            <div className="esign__card gideon__node">
                <div>
                <NodeHeader
                  header="Signature"
                />
                <div className="uploaded-files-container">
                <div className="uploaded-file-name-readonly-link">
                {this.props.files.map((file: any) => (
                    <div className="uploaded-file-name-readonly-link">
                      <a target="_blank" href={file.url}>{"signed document"}</a>
                    </div>
                ))}
                </div>
            </div>
                </div>
            </div>
        )
    }
}



