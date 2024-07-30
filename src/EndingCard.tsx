import { DirectLineOptions } from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import { NodeHeader } from './nodes/containers/NodeHeader';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import { connect } from 'react-redux';

import { EsignNode, EsignPopup, EsignCheckMark } from './assets/icons/EsignIcons';
import { FormattedText } from './FormattedText';
import { sendSignature } from './api/bot';
import { Hidden } from '@material-ui/core';
import { isMobile } from 'react-device-detect';
//will most likely need read only card too for after signing
//need to add fullscreen variable to check
export interface Node {
    node_type: string;
    document: any;
    meta: any;
    
}

export interface EndingCardProps {
    post_message: any;
    post_meta: any;
    pre_message: any;
    pre_meta: any;
    fullscreen: boolean;
    fullheight: boolean;
}

export class EndingCard extends React.Component<EndingCardProps, {}> {
    constructor(props: EndingCardProps) {
        super(props);

        this.state = {
          showDisclaimer: false
        };
    }
    

    //change list view to button
    render() {
        if(this.props.fullscreen == true && isMobile == false){
            // do fullscreen version -> modify srtyling
            if(document.getElementById('btn3') != null){
                //document.getElementById('btn3').style.display = "none"
            }
            if(document.getElementById("presignnode")!= null){
               //document.getElementById("presignnode").style.display = "none"
              
            }
            return (
                <div className="modal-fullscreen">
                <div className="modal-content-full">
                <div className='presign_area_full_post'>
                    <EsignNode />
                </div>      
                <div className="esign__card gideon__node">
                    <div className="esign__card esign__node">
                        <div className='esign-message-handoff-bigfull'>
                            {this.props.post_meta.header || "Thank you for your time!" }
                        </div>
                        <div className="esign-message-handoff-small2">
                        {this.props.post_message ||
                     "We appreciate you taking the time out of your day to answer our questions!"}
                          
                        </div>
                    </div>
                
    
                </div>
               
                </div>
                </div>
            )
        } else {
            // not fullscreen styling
            if(document.getElementById('btn3') != null){
                //document.getElementById('btn3').style.display = "none"
            }
            if(document.getElementById("presignnode")!= null){
               //document.getElementById("presignnode").style.display = "none"
              
            }
            return (
                <div className="modal-normal">
                <div className="modal-content">
                <div className="esign__card gideon__node">
                    <div>
                    
                        <div className="document_area2">
                            <EsignNode />
                        </div>
                        <div className='esign-message-handoff-big2'>
                            {this.props.post_meta.header || "Thank you for your time!" }
                        </div>
                        <div className="esign-message-handoff-small2">
                        <FormattedText
                            text={this.props.post_message || "We appreciate you taking the time out of your day to answer our questions!"}
                            format={ 'markdown' }
                            onImageLoad={null}
                        />
                          
                        </div>
                    </div>
                </div>
    
                </div>
               
                </div>
            )
            
        }
       
    }
}