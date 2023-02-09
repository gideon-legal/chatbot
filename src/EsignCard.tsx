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
    
}

//passed to card
interface EsignProps {
    node: Node;
    sendMessage: (inputText: string) => void;
    directLine?: DirectLineOptions
    gid: string;
    conversationId: string;
    document: string;
    docx: string;
    prompt: string;

}

export interface EsignState {
    file: any;
    signature: string;
    signError: string;
    formattedMessage: string;
    phase: string;
    hoveredFile: number;
    handoff_message: string;
    willSubmit: boolean;
    signedfile: any;
    completedDoc: boolean;
    validated: boolean;
    isPopup: boolean;

}


class Esign extends React.Component<EsignProps, EsignState> {
    constructor(props: EsignProps){
        super(props);

        this.state = {
            file: this.props.document,
            signature: '',
            signError: '',
            formattedMessage: '',
            phase: '',
            hoveredFile: null,
            handoff_message: "",
            willSubmit: false,
            signedfile: '',
            completedDoc: false,
            validated: false,
            isPopup: true


        }

        //handleKeyDown here etc
        this.onChangeSignature = this.onChangeSignature.bind(this)
    }

    handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>){
        console.log("hit enter")
        if (e.key === 'Enter' && this.validateSignature()){
            console.log("hit if case enter")
            sendSignature(this.props.gid, this.props.directLine.secret, this.props.conversationId, this.state.signature, this.props.docx)
            .then((res: any) => {
                this.setState({
                    ...this.state,
                    signedfile: res.data.link
                })
            })
            //once document is confirmed and received, set to this.state.signedfile, set completedDoc to true
            this.setState({
                ...this.state,
                completedDoc: true,
                isPopup: false
            })
            document.removeEventListener('keypress', this.handleKeyDown.bind(this))
        }
    }
  
    /** Validates inputted signature */
    validateSignature = () => {
        let validated = true;
        let signError;

        if(this.state.signature == ''){
            signError = 'Please enter signature'
            validated = false
        }

        this.setState({
            ...this.state,
            validated: validated,
            signError
        })

        return validated;

    }

    /** For submit button for signature */
    clickToSubmitSignature(e: React.MouseEvent<HTMLButtonElement>){
        if(!this.validateSignature()) { return;}
        

        //need to send to api so it can be used to populate document
        console.log("hey everybody!!!!!!!")
        console.log(this.props.docx)
        console.log("obtained signature")
        console.log(this.state.signature)
        //send to api and wait to receive signed pdf link, set to this.state.signedfile
        sendSignature(this.props.gid, this.props.directLine.secret, this.props.conversationId, this.state.signature, this.props.docx)
        .then((res: any) => {
            this.setState({
                ...this.state,
                signedfile: res.data.link
            })
        })
        //once document is confirmed and received, set to this.state.signedfile, set completedDoc to true
        this.setState({
            ...this.state,
            completedDoc: true,
            isPopup: false
        })
        //send signal to move on from node? - need readonly version of card
    }

    onChangeSignature(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            ...this.state,
            signature: event.target.value
        })
        console.log("changed signature")
        console.log(this.state.signature)
    }


    // prototype for displaying document + signing it
    renderDocument = () => {
        //display document if present
             let documentSection = (
                <div>
                    
                      {/*<a target="_blank" href={this.state.file}>{"file to sign"}</a>*/}
                      <iframe className="esign-document-display" src={`${this.state.file}#toolbar=0`} ></iframe>
                     
                    

               
                <div className="signature-box-area">

                    <div className='esign-black-text'>
                       Type in Full Name to Create Signature
                    </div>
                    <div className='esign-grey-text'>
                    FULL NAME

                    </div>

                    <div>
                        <input className="esign-input-box" type="text" value={this.state.signature} onChange={this.onChangeSignature} id="signature"></input>
                    </div>
                    <div className="submit-area">
                        <button  className="gideon-submit-button" onClick={e => this.clickToSubmitSignature(e)}> SIGN </button>
                    </div>

                 </div>
                </div>
                
            )
        return documentSection
    }

    handleSign(e: React.MouseEvent<HTMLButtonElement>){
        this.setState({
            willSubmit: true,
            isPopup: true
        })
    }

    handleSkip(e: React.MouseEvent<HTMLButtonElement>){
        this.setState({
            isPopup: false
        })
    }

    //initial starting screen, should be popup, for now is treated as node
    renderStartingScreen() {
        return (
            <div>
                <div className="esign__card esign__node">
                <div className= {this.state.validated && !this.state.isPopup ? "esign-checkmark" : "esign-checkmark__disabled"}>
                         <EsignCheckMark />
                    </div>
                    <div className="document_area">
                        <EsignNode />
                    </div>
                    <div className="esign-message-handoff">
                            Place holder {this.state.handoff_message}
                    </div>
                </div> 
                <button type="button" className="gideon-submit-button" id="sign_btn" onClick={e => this.handleSign(e)}>
                     Review & Sign
                </button>
                 <div>
                    <button type="button" className={ this.state.isPopup ? "gideon-submit-button-white" : "gideon-submit-button-white__disabled"} onClick={e => this.handleSkip(e)}>
                         Sign Later
                    </button>
                </div> 
            </div>
        );

    }

    //For when the sign button leads to small modal to sign
    renderSignatureModal() {
        <div className="signature-modal">
            <div className="signature-box-area">

            <div className='esign-black-text'>
               Type in Full Name to Create Signature
            </div>
            <div className='esign-grey-text'>
               FULL NAME

            </div>

        <div>
           <input className="esign-input-box" type="text" value={this.state.signature} onKeyPress={this.handleKeyDown} onChange={this.onChangeSignature} id="signature"></input>
        </div>
       <div className="submit-area">
              <button  className="gideon-submit-button" onClick={e => this.clickToSubmitSignature(e)}> SIGN </button>
        </div>

       </div>
       </div>
    }

    //rendered when signed document is returned, can view document and then exit out?
    renderCompletedDoc() {
        //display document if present
        let documentSection = (
            <div>
                <div className="uploaded-files-container">
                <div className="uploaded-file-name-readonly-link">
                  <a target="_blank" href={this.state.signedfile}>{"signed file"}</a>
                 
                </div>

            </div>
            
            </div>
            
        )
    return documentSection
    }

    renderPopup(){
        const {willSubmit, completedDoc} = this.state;
        return (
            <div className="modal">
                <div className="modal-content">
                <div className="esign__card gideon__node">
                <NodeHeader
                header="Signature"
                />
                {willSubmit == false && this.renderStartingScreen()}
                {willSubmit == true && completedDoc == false && this.renderDocument()}
                {willSubmit == true && completedDoc == true && this.renderCompletedDoc() }
    
            </div>
    
                </div>
    
            </div>
        );


    }

    renderNode(){
        const {willSubmit, completedDoc} = this.state;

        return (
            <div className="esign__card gideon__node">
            <NodeHeader
            header="Esign Document"
            />
            {willSubmit == false && this.renderStartingScreen()}
            {willSubmit == true && completedDoc == false && this.renderDocument()}
            {willSubmit == true && completedDoc == true && this.renderCompletedDoc() }

        </div>
        )
    }



    //screen 1: message + button to sign
    //screen 2: document viewable + signature box

    render() {
        const {willSubmit, completedDoc, isPopup} = this.state;
       //need to add if case for when to show renderSigningIcon vs renderDocument
        
       //need if statement to determine if using popup or node version

       return (
        <div>
            {isPopup == true && this.renderPopup()}
           {isPopup == false && this.renderNode()}
        </div>
        
    );

    }
} 

export const EsignCard = connect(
    (state: ChatState) => {
        return {
            locale: state.format.locale,
            user: state.connection.user,
            conversationId: state.connection.botConnection.conversationId
        }
    }, {
        sendMessage
    },
     (stateProps: any, dispatchProps: any, ownProps: any): EsignProps => {
        console.log(stateProps)
        console.log(ownProps)
        console.log(dispatchProps)
        return {
            // from stateProps
            node: ownProps.node,
            // from dispatchProps
            sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
            gid: ownProps.gid,
            directLine: ownProps.directLine,
            conversationId: stateProps.conversationId,
            document: ownProps.activity.pdf_link.pdf_link[0],
            docx: ownProps.activity.pdf_link.docx_link[0],
            prompt: ownProps.text    
        }
    }
)(Esign);