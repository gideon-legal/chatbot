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
//need to add fullscreen variable to check
export interface Node {
    node_type: string;
    document: any;
    meta: any;
    
}

export interface EsignCardReadOnlyProps {
    files: Array<{ name: string, url: string }>;
    post_message: any;
    fullscreen: boolean;
    fullheight: boolean;
}

export class EsignCardReadOnly extends React.Component<EsignCardReadOnlyProps, {}> {
    constructor(props: EsignCardReadOnlyProps) {
        super(props);

        this.state = {
          showDisclaimer: false,
          savedfiles: this.props.files
        };
        //add files to sessionStorage for refresh?
        if(this.props.files.length > 0){
            sessionStorage.setItem("file",this.props.files[0].url)
        }
    }

    //change list view to button
    render() {
        if(this.props.fullscreen == false){
            // do fullscreen version -> modify srtyling
            if(document.getElementById('btn3') != null){
                document.getElementById('btn3').style.display = "none"
            }
            if(document.getElementById("presignnode")!= null){
               document.getElementById("presignnode").style.display = "none"
              
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
                            Congrats! 
                        </div>
                        <div className="esign-message-handoff-small2">
                        {this.props.post_message.postesign_message ||
                     "Please download your completed representation agreement below. A member of our team will be in touch to advise you on your next steps. Thank you!"}
                          
                        </div>
                    <div className="uploaded-files-container2">
                    <div >
                        {this.props.files.length <= 0 ? <a className="gideon-submit-button-download" target="_blank" href={sessionStorage.getItem("file")}>{"Download Document"}</a> :
                        this.props.files.map((file: any) => (
                            <a className="gideon-submit-button-download" target="_blank" href={file.url}>{"Download Document"}</a>
                         
                      ))
                        }
                  
                    </div>
                </div>
                    </div>
                </div>
    
                </div>
               
                </div>
            )
        } else {
            // not fullscreen styling
            if(document.getElementById('btn3') != null){
                document.getElementById('btn3').style.display = "none"
            }
            if(document.getElementById("presignnode")!= null){
               document.getElementById("presignnode").style.display = "none"
              
            }
            return (
                <div className="modal-fullscreen">
                <div className="modal-content-full">
                <div className="esign__card gideon__node">
                    <div>
                    
                        <div className="document_area2">
                            <EsignNode />
                        </div>
                        <div className='esign-message-handoff-big2'>
                            Congrats! 
                        </div>
                        <div className="esign-message-handoff-small2">
                        {this.props.post_message.postesign_message ||
                     "Please download your completed representation agreement below. A member of our team will be in touch to advise you on your next steps. Thank you!"}
                          
                        </div>
                    <div className="uploaded-files-container2">
                    <div >
                        {this.props.files.length <= 0 ? <a className="gideon-submit-button-download" target="_blank" href={sessionStorage.getItem("file")}>{"Download Document"}</a> :
                        this.props.files.map((file: any) => (
                            <a className="gideon-submit-button-download" target="_blank" href={file.url}>{"Download Document"}</a>
                         
                      ))
                        }
                  
                    </div>
                </div>
                    </div>
                </div>
    
                </div>
               
                </div>
            )
            
        }
       
    }
}



