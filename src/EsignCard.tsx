import { DirectLineOptions } from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import { NodeHeader } from './nodes/containers/NodeHeader';
import { ChatState } from './Store';
import { ChatActions, sendMessage, sendFiles } from './Store';
import { connect } from 'react-redux';
import { isMobile } from 'react-device-detect';
import { EsignNode, EsignPopup, EsignCheckMark, EsignPreSign, EsignPen, EsignPreSignFull } from './assets/icons/EsignIcons';
import { sendSignature } from './api/bot';
import { Hidden } from '@material-ui/core';
import { any } from 'bluebird';
import { FileslistFormatter } from 'tslint/lib/formatters';
//import { pdfjs, Document } from 'react-pdf';
//pdfjs.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.js`;



//will most likely need read only card too for after signing
export interface Node {
    node_type: string;
    document: any;
    
}

//passed to card
interface EsignProps {
    node: Node;
    sendMessage: (inputText: string) => void;
    sendFiles: (files: FileList) => void;
    directLine?: DirectLineOptions
    gid: string;
    conversationId: string;
    document: string;
    docx: string;
    prompt: string;
    addFilesToState: (index: number, files: Array<{ name: string, url: string }>) => void;
    index: number;
    fullheight: boolean;
    fullscreen: boolean;

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
    files: any;
    isDocument: boolean;
    isSignature: boolean;
    isFullscreen: boolean;
    isFullHeight: boolean;
    loading: boolean;
    initials: string;
    isModal: boolean;

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
            isPopup: true,
            files: [],
            isDocument: false,
            isSignature: false,
            isFullscreen: this.props.fullscreen,
            isFullHeight: this.props.fullheight,
            loading: false,
            initials: '',
            isModal: false //for switching between pdf viewer and signing modal on mobile
            


        }

        //handleKeyDown here etc
        this.onChangeSignature = this.onChangeSignature.bind(this)
    }

    handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>){
        console.log("hit enter")
        if (e.key === 'Enter' && this.validateSignature()){
            console.log("hit if case enter")
            sendSignature(this.props.gid, this.props.directLine.secret, this.props.conversationId, this.state.signature, this.props.docx,this.state.initials)
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

    renderLoading(){
         console.log("in loading")
         return (
            <div className='loading_esign'>
                <div id="loading-bar-spinner" className="spinner"><div className="spinner-icon"></div></div>
            </div>
         )
    }

    /** For submit button for signature */
    clickToSubmitSignature(e: React.MouseEvent<HTMLButtonElement>){
        //disable button
        this.setState({
            ...this.state,
            loading: true
        })
        console.log("loading")
        console.log(this.state.loading)
        this.renderLoading()
        let loading_div = document.createElement("div")
        loading_div.setAttribute("class", "loading_esign")
        let loader_wheel = document.createElement("div")
        loader_wheel.setAttribute("class", "loaderwheel_esign")

        let sign_btn = document.getElementById("sign-btn");
        console.log(sign_btn)
        sign_btn.setAttribute("class", "gideon-submit-button-sign-disabled");
        document.getElementById("pdfarea").appendChild(loading_div).appendChild(loader_wheel)
        if(!this.validateSignature()) { return;}
        

        //need to send to api so it can be used to populate document
        console.log("hey everybody!!!!!!!")
        console.log(this.props.docx)
        console.log("obtained signature")
        console.log(this.state.signature)
        //send to api and wait to receive signed pdf link, set to this.state.signedfile
        sendSignature(this.props.gid, this.props.directLine.secret, this.props.conversationId, this.state.signature, this.props.docx, this.state.initials)
        .then((res: any) => {
            console.log(res.data)
            this.setState({
                ...this.state,
                signedfile: res.data.pdf_link
            })
            //once document is confirmed and received, set to this.state.signedfile, set completedDoc to true
        //send signal to move on from node? - need readonly version of card
        const files = []
        files.push({name: 'signed_document.pdf', url: this.state.signedfile})
        this.setState({
            ...this.state,
            completedDoc: true,
            isPopup: false,
            files: files,
            loading: false
        })
        console.log("files array")
        console.log(files)
        console.log("signed file")
        console.log(this.state.signedfile)
        this.props.addFilesToState(this.props.index, files)
        this.props.sendMessage(JSON.stringify(this.state.signedfile))
        })
    }

    onChangeSignature(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            ...this.state,
            signature: event.target.value
        })
        console.log("changed signature")
        console.log(this.state.signature)
    }

    /*handlePdf() {
        let loadingPdf = pdfjs.getDocument(encodeURI(this.state.file))
       loadingPdf.promise.then(function(pdf){
        pdf.getPage(1).then(function(page)  {
            console.log('page loaded')
            

            
        })
       })

    }*/

    //full screen
    renderLargerPdf = () => {
       //this.handlePdf()
        console.log("mobile check: ")
        console.log(isMobile)
        if(isMobile == true){
            if(this.state.isSignature == true) {
                 //mobile view
            let pdfView = (
                <div className="fullview">
                    
                    <div className="pdfholder-notop">
                    <iframe id="pdf-js-viewer" className="esign-document-display" src={"https://drive.google.com/viewerng/viewer?embedded=true&url="+encodeURIComponent(this.state.file) } 
                    height="90%" width="100%" scrolling='auto'></iframe>
                    <div className="mobileview" >
                        {this.renderSignatureMobile()}
    
                    </div>
    
                    </div>
    
                </div>   
            )
            return pdfView

            } else {
                 //mobile view
            let pdfView = (
                <div className="fullview">
                     <div className= "esign_topbar">
                        <div className= "esign-topbar-buttons">
                        {/*<button  className="gideon-download-button1" > DOWNLOAD </button>*/}
                        <button  className="gideon-download-button2" onClick={e => this.scrollToElement()}> SIGN NOW </button>
    
                        </div>
                    </div>
                    <div className="pdfholder-mobile-full">
                   
                    <div id="sign-area">
                    {this.renderSignatureMobile()}
                    </div>
    
                    </div>
    
                </div>   
            )
            return pdfView

            }
        } else {
            let pdfView = (
                <div className="fullview" id="fullpdf">
                    <div className="pdfholder" id="pdfarea">
                    {/*<Document file={{url: this.state.file}} onLoadError={(error) => console.log("inside error", error)}></Document> testing of react-pdf*/}
                    <iframe className="esign-document-display"  frameBorder="0" src={`${this.state.file}#toolbar=0&#FitH&#zoom=150`} height="84%" width="100%" scrolling='yes'></iframe>
                    <div className="sign-area">
                    {this.renderSignatureMobile()}
                    </div>
                    </div>
    
                </div>   
            )
            return pdfView

        } 
    }

    handleSign(e: React.MouseEvent<HTMLButtonElement>){
        this.setState({
            willSubmit: true,
            isPopup: true,
            isDocument: true
        })
    }

    handleSkip(e: React.MouseEvent<HTMLButtonElement>){
        this.setState({
            isPopup: false
        })
    }

    handleSignModal(e: React.MouseEvent<HTMLButtonElement>){
        this.setState({
            isSignature: true,
            isPopup: true
        })

    }

    handleSignModalMobile(e: React.MouseEvent<HTMLButtonElement>){
        this.setState({
            isSignature: true,
            isModal: true
        })
    }

    scrollToElement(){
        var scrollTo = document.getElementById("sign-area");
        scrollTo.scrollIntoView({behavior:'smooth',block:'start'})
    }

    //initial starting screen, should be popup, for now is treated as node
    renderStartingScreen() {
        //need special styling for fullscreen
        if(this.state.isFullscreen ==  true){
            return (
                <div>
                <div className="esign__card esign__node">
                <div className= {this.state.validated && !this.state.isPopup ? "esign-checkmark" : "esign-checkmark__disabled"}>
                         <EsignCheckMark />
                    </div>
                    <div className="esign-message-handoff-big">
                           You're almost done! 
                    </div>
                    <div className="esign-message-handoff-small">
                        To start working with McCune Law Group, please click on the button below to sign your representation agreement
                    </div>
                </div> 
                <button type="button" className="gideon-submit-button" id="sign_btn" onClick={e => this.handleSign(e)}>
                     <EsignPen/> Review & Sign Now
                </button>
                 <div>
                    {/*<button type="button" className={ this.state.isPopup ? "gideon-submit-button-white" : "gideon-submit-button-white__disabled"} onClick={e => this.handleSkip(e)}>
                         Sign Later
        </button>*/}
                </div> 
            </div>

            );
        }
        return (
            <div>
                 
                <div className="esign__card esign__node">
                <div className= {this.state.validated && !this.state.isPopup ? "esign-checkmark" : "esign-checkmark__disabled"}>
                         <EsignCheckMark />
                    </div>
                    <div className="esign-message-handoff-big">
                           You're almost done! 
                    </div>
                    <div className="esign-message-handoff-small">
                        To start working with McCune Law Group, please click on the button below to sign your representation agreement
                    </div>
                </div> 
                <button type="button" className="gideon-submit-button" id="sign_btn" onClick={e => this.handleSign(e)}>
                     <EsignPen/> Review & Sign Now
                </button>
                 <div>
                    {/*<button type="button" className={ this.state.isPopup ? "gideon-submit-button-white" : "gideon-submit-button-white__disabled"} onClick={e => this.handleSkip(e)}>
                         Sign Later
        </button>*/}
                </div> 
            </div>
        );

    }

    //For when the sign button leads to small modal to sign
    renderSignatureModal() {
        let sig = (
            <div className="modal-signature">
                <div className="modal-content">
                <div className="signature-box-area">

                <div className='esign-black-text'>
                    Type in Full Name to Create Signature
                </div>
               <div className='esign-grey-text'>
                 FULL NAME

                 </div>

             <div className="submit-area">
              <input className="esign-input-box" type="text" value={this.state.signature} onKeyPress={this.handleKeyDown} onChange={this.onChangeSignature} id="signature"></input>
            </div>
           <div className="submit-area">
              <button  className="gideon-submit-button" onClick={e => this.clickToSubmitSignature(e)}> SIGN </button>
           </div>

           </div>   
                </div>
                 

            </div>
        )
        return sig
      
    }

    //Displays signature at bottom of screen when viewing pdf
    renderSignatureMobile() {
        let sig = (
            
                
                <footer className="signature-box-area">

                
             <div className="submit-area">
              <input className="esign-input-box" placeholder="Type in Full Name to Create Signature" type="text" value={this.state.signature} onKeyPress={this.handleKeyDown} onChange={this.onChangeSignature} id="signature"></input>
              <div className="button-area">
              <button  id="sign-btn" className="gideon-submit-button" style={{width: "80%" }} onClick={e => this.clickToSubmitSignature(e)}> SIGN </button>
              </div>
            </div>
           

           </footer>   
               
                 

        )
        return sig
      
    }

    renderPopup(){
        const {willSubmit, completedDoc, isSignature, isFullHeight, isFullscreen} = this.state;
            //normal screen
            let esignPopup = (
                <div className="modal-normal">
                <div className="modal-content">
                <div className="presign_area">
                        <EsignPreSign />
                </div>
                <div className="esign__card gideon__node">
                
                {willSubmit == false &&  this.renderStartingScreen()}
                {/*willSubmit == true && completedDoc == false && this.renderLargerPdf()*/}
                {/*willSubmit == true && completedDoc == true && this.renderCompletedDoc() */}
                {/*isSignature == true && this.renderSignatureModal()*/}
            </div>
                </div>
            </div>

            )
        if(isFullHeight == true){
            //fullscreen css
            esignPopup = (
                <div className="modal-fullheight">
                <div className="modal-content">
                <div className="presign_area_full">
                        <EsignPreSign />
                </div>
                <div className="esign__card gideon__node">
                {willSubmit == false && this.renderStartingScreen()}
                {/*willSubmit == true && completedDoc == false && this.renderLargerPdf()*/}
                {/*willSubmit == true && completedDoc == true && this.renderCompletedDoc() */}
                {/*isSignature == true && this.renderSignatureModal()*/}
            </div>
                </div>
            </div>
            )
        }
        if(isFullscreen == true){
            //fullheight css
            esignPopup = (
                <div className="modal-fullscreen">
                <div className="modal-content-full">
                <div className="presign_area_full">
                        <EsignPreSignFull />
                </div>
                <div className="esign__card gideon__node">
                {willSubmit == false && this.renderStartingScreen()}
                {/*willSubmit == true && completedDoc == false && this.renderLargerPdf()*/}
                {/*willSubmit == true && completedDoc == true && this.renderCompletedDoc() */}
                {/*isSignature == true && this.renderSignatureModal()*/}
    
            </div>
                </div>
            </div>
            )
        }
        if(isMobile == true){
            esignPopup = (
                <div className="modal-normal">
                <div className="modal-content-mobile">
                <div className="presign_area">
                        <EsignPreSign />
                </div>
                <div className="esign__card gideon__node">
                {willSubmit == false && this.renderStartingScreen()}
                {/*willSubmit == true && completedDoc == false && this.renderLargerPdf()*/}
                {/*willSubmit == true && completedDoc == true && this.renderCompletedDoc() */}
                {/*isSignature == true && this.renderSignatureModal()*/}
            </div>
                </div>
            </div>
            )

        }
        return esignPopup;
    }

    renderNode(){
        const {willSubmit, completedDoc} = this.state;

        return (
            <div className="esign__card gideon__node">
            <NodeHeader
            header="Signature"
            />
            {willSubmit == false && this.renderStartingScreen()}
            {/*willSubmit == true && completedDoc == false && this.renderLargerPdf()*/}
            {/*willSubmit == true && completedDoc == true && this.renderCompletedDoc() */}

        </div>
        )
    }

    renderFullscreen(){
        const {willSubmit, completedDoc, loading} = this.state;

        return (
            <div className='esign_fullwindow'>
                {willSubmit == true && completedDoc == false && this.renderLargerPdf()}

            </div>
        )
    }



    //screen 1: message + button to sign
    //screen 2: document viewable + signature box

    render() {
        const {willSubmit, completedDoc, isPopup, isDocument, isSignature} = this.state;
       return (
        <div>
            {isDocument == true && this.renderFullscreen()}
            {isPopup == true && isDocument == false && this.renderPopup()}
           {isPopup == false && isDocument == false && this.renderNode()}
           {isSignature == true && isMobile == false && this.renderSignatureModal()}
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
        sendMessage,
        sendFiles
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
            sendFiles: (files: FileList) => dispatchProps.sendFiles(files, stateProps.user, stateProps.locale),
            gid: ownProps.gid,
            directLine: ownProps.directLine,
            conversationId: stateProps.conversationId,
            document: ownProps.activity.pdf_link.pdf_link[0],
            docx: ownProps.activity.pdf_link.docx_link[0],
            prompt: ownProps.text,
            addFilesToState: ownProps.addFilesToState,
            index: ownProps.index,
            fullheight: ownProps.format.full_height,
            fullscreen: ownProps.format.fullscreen
        }
    }
)(Esign);