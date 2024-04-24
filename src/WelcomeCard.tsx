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
import { isMobile } from 'react-device-detect';
//will most likely need read only card too for after signing
//need to add fullscreen variable to check
export interface Node {
    node_type: string;
    meta: any;
    
}

export interface WelcomeCardProps {
    meta: any;
    activity: any;
    
}

export class WelcomeCard extends React.Component<WelcomeCardProps, {}> {
    constructor(props: WelcomeCardProps) {
        super(props);

        this.state = {
          showDisclaimer: false
        };
    }

    
    

    //change list view to button
    render() {
        console.log("props: ")
        console.log(this.props)
        console.log(this.props.activity.text)
        if(this.props.meta.fullscreen == true && isMobile == false){
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
                    <div className="welcome-card gideon__node">
                        <div>
                            
                        </div>
                        <div className="vid_area"></div>
                        <div className='welcome-bigtext'>
                            {this.props.meta.header || "Custom Header" }
                        </div>
                        <div className="welcome-smalltext">
                        {this.props.meta.message ||
                     "Welcome page"}
                    
                          
                        </div>
                    </div>
                    <div className="welcome-button">
                        <button className="gideon-submit-button">{"Continue" || this.props.meta.cta}</button>
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
                    <div className="welcome-card">
                    
                        <div className="vid_area">
                            
                        </div>
                        <div className='welcome-bigtext'>
                            {this.props.meta.header || "Custom Header" }
                        </div>
                        <div className="welcome-smalltext">
                        {this.props.meta.message ||
                     "Welcome page"}
                          
                        </div>
                        <div className="welcome-button">
                        <button className="gideon-submit-button">{"Continue" || this.props.meta.cta}</button>
                        </div>
                       
                    </div>

                </div>
    
                </div>
               
                </div>
            )
            
        }
       
    }
}