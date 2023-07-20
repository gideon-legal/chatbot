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

export interface DocassembleCardProps {
    files: any;
    post_message: any;
    fullscreen: boolean;
    fullheight: boolean;
    file_format: string;
}

export class DocassembleCard extends React.Component<DocassembleCardProps, {}> {
    constructor(props: DocassembleCardProps) {
        super(props);

        this.state = {
          showDisclaimer: false,
          savedfiles: this.props.files
        };

        if(this.props.files.length > 0){
            sessionStorage.setItem("file",this.props.files[0].url)
        }      
    }
    

    //change list view to button
    render() {
        if(this.props.fullscreen == true){
            // do fullscreen version -> modify srtyling
            if(document.getElementById('btn3') != null){
                document.getElementById('btn3').style.display = "none"
            }
            if(document.getElementById("presignnode")!= null){
               document.getElementById("presignnode").style.display = "none"
              
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
                            Congrats! 
                        </div>
                        <div className="esign-message-handoff-small2">
                        {this.props.post_message.userdownload_message ||
                     "Please download your completed representation agreement below. A member of our team will be in touch to advise you on your next steps. Thank you!"}
                          
                        </div>
                    <div className="fullbutton-testpost">
                    <div >
                        {this.props.files.length <= 0 ? <a className="gideon-submit-button-download-full" target="_blank" href={sessionStorage.getItem("file")}>{"Download Document"}</a> :
                        this.props.files.pdf_link.map((file: any) => (
                            <a className="gideon-submit-button-download-full" target="_blank" href={this.props.file_format == 'docx' ? this.props.files.docx_link[0] : this.props.files.pdf_link[0]}>{"Download Document"}</a>
                         
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
                        {this.props.post_message.userdownload_message ||
                     "Please download your completed representation agreement below. A member of our team will be in touch to advise you on your next steps. Thank you!"}
                          
                        </div>
                    <div className="uploaded-files-container2">
                    <div >
                        {this.props.files.length <= 0 ? <a className="gideon-submit-button-download" target="_blank" href={sessionStorage.getItem("file")}>{"Download Document"}</a> :
                        this.props.files.pdf_link.map((file: any) => (
                            <a className="gideon-submit-button-download" target="_blank" href={this.props.file_format == 'docx' ? this.props.files.docx_link[0] : this.props.files.pdf_link[0]}>{"Download Document"}</a>
                         
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