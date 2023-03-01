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

    //change list view to button
    render() {
        return (
            <div className="modal-normal">
            <div className="modal-content">
            <div className="esign__card gideon__node">
                <div>
                
                    <div className="document_area">
                        <EsignNode />
                    </div>
                    <div className='esign-message-handoff-big2'>
                        Congrats! 
                    </div>
                    <div className="esign-message-handoff-small2">
                        Please download your completed representation agreement below. A member of our team will be in touch 
                        to advise you on your next steps. Thank you!
                    </div>
                <div className="uploaded-files-container">
                <div >
                {this.props.files.map((file: any) => (
                    
                      <a className="gideon-submit-button-download" target="_blank" href={file.url}>{"Download Document"}</a>
                   
                ))}
                </div>
            </div>
                </div>
            </div>

            </div>
           
            </div>
        )
    }
}



