import { DirectLineOptions } from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import { NodeHeader } from './nodes/containers/NodeHeader';
import { ChatState } from './Store';
import { ChatActions, sendMessage, sendFiles } from './Store';
import { connect } from 'react-redux';
import { isMobile } from 'react-device-detect';
import { EsignNode, EsignPopup, EsignCheckMark, EsignPreSign, EsignPen } from './assets/icons/EsignIcons';
import { sendSignature } from './api/bot';
import { Hidden } from '@material-ui/core';
import { any } from 'bluebird';
import { FileslistFormatter } from 'tslint/lib/formatters';
import { pdfjs, Document, Page} from 'react-pdf';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api' //or node_modules/@types/react-pdf/node_modules/pdfjs-dist/types/src/display/api
pdfjs.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.js`;



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
    accountNum: boolean;
    presignText: string;

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
    numPages: number;
    hasBank: boolean;
    bankNum: string;
    isNext: boolean;

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
            isModal: false, //for switching between pdf viewer and signing modal on mobile,
            numPages: 0,
            hasBank: this.props.accountNum, //for aditional input field, passed from props
            bankNum: '',
            isNext: false,

            


        }

        //handleKeyDown here etc
        this.onChangeSignature = this.onChangeSignature.bind(this)
        this.onChangeInitials = this.onChangeInitials.bind(this)
        this.onChangeBankAccount = this.onChangeBankAccount.bind(this)

    }

    handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>){
        if (e.key === 'Enter' && this.validateSignature()){
            sendSignature(this.props.gid, this.props.directLine.secret, this.props.conversationId, this.state.signature, this.props.docx,this.state.initials, this.state.bankNum)
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
            signError: signError
        })

        return validated;

    }

    renderLoading(){
         return (
            <div className='loading_esign'>
                <div id="loading-bar-spinner" className="spinner"><div className="spinner-icon"></div></div>
            </div>
         )
    }

    /** For submit button for signature */
    clickToSubmitSignature(e: React.MouseEvent<HTMLButtonElement>){
        //disable button
        if(this.state.signature != ''){
            this.setState({
                ...this.state,
                loading: true
            })
            this.renderLoading()
            let loading_div = document.createElement("div")
            loading_div.setAttribute("class", "loading_esign_mobile")
            let loader_wheel = document.createElement("div")
            if(this.state.isModal == true){
                loader_wheel.setAttribute("class", "loaderwheel_esign_mobile")
                let sign_btn = document.getElementById("sign-btn");
                sign_btn.setAttribute("class", "gideon-submit-button-sign-disabled");
                document.getElementById("mobile-modal").appendChild(loading_div).appendChild(loader_wheel)
            } else {
                loader_wheel.setAttribute("class", "loaderwheel_esign")
    
               let sign_btn = document.getElementById("sign-btn");
               sign_btn.setAttribute("class", "gideon-submit-button-sign-disabled");
               document.getElementById("pdfarea").appendChild(loading_div).appendChild(loader_wheel)
            }
            if(!this.validateSignature()) { return;}
            
    
            //need to send to api so it can be used to populate document
            //send to api and wait to receive signed pdf link, set to this.state.signedfile
            sendSignature(this.props.gid, this.props.directLine.secret, this.props.conversationId, this.state.signature, this.props.docx, this.state.initials, this.state.bankNum)
            .then((res: any) => {
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
                loading: false,
                isModal: false
            })
            this.props.addFilesToState(this.props.index, files)
            this.props.sendMessage(JSON.stringify(this.state.signedfile))
            })

        }
    }

    onChangeSignature(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            ...this.state,
            signature: event.target.value
        })
    }

    onChangeInitials(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            ...this.state,
            initials: event.target.value
        })
    }

    onChangeBankAccount(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            ...this.state,
            bankNum: event.target.value
        })

    }

    
    //Handles getting the number of page numbers needed to display the pdf
    onDocumentLoad(pdf: any){
        this.setNumPages(pdf.numPages) 
    }

    //Handles setting the number of page numbers of the pdf
    setNumPages(numPages: any){
        this.setState({
           numPages: numPages
        })
       
        
    }

    renderLargerPdf = () => {
        if(isMobile == true){
            if(this.state.isSignature == true && this.state.isModal == false) {
                 //mobile view
            let pdfView = (
                <div className="fullview">
                    
                    <div className="pdfholder-notop">
                    {<div  className='esign-document-holder'>
                        <Document file={this.state.file} onLoadSuccess={pdf => this.onDocumentLoad(pdf)} >
                             {
                             Array.apply(null, Array(this.state.numPages)).map(( x: any, i: number)=>i+1).map((page: number) => <Page pageNumber={page} className="esign-document-display2"></Page>)}
                         </Document>
                        </div>}
                    {/*<iframe id="pdf-js-viewer" className="esign-document-display" src={"https://drive.google.com/viewerng/viewer?embedded=true&url="+encodeURIComponent(this.state.file) } 
                    height="90%" width="100%" scrolling='auto'></iframe>*/}
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
                     <div className= "pdfholder-notop">
                    </div>
                    <div className="pdfholder-mobile-full">
                    {<div  className='esign-document-holder'>
                        <Document file={this.state.file} onLoadSuccess={pdf => this.onDocumentLoad(pdf)} >
                             {
                             Array.apply(null, Array(this.state.numPages)).map(( x: any, i: number)=>i+1).map((page: number) => 
                             <Page pageNumber={page}  className="esign-document-display-mobile"></Page>)}
                         </Document>
                        </div>}
                   
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
                        {<div  className='esign-document-holder'>
                        <Document file={this.state.file} onLoadSuccess={pdf => this.onDocumentLoad(pdf)} >
                             {
                             Array.apply(null, Array(this.state.numPages)).map(( x: any, i: number)=>i+1).map((page: number) => <Page pageNumber={page} className="esign-document-display2"></Page>)}
                         </Document>
                        </div>}
                    {/*<iframe className="esign-document-display"  frameBorder="0" src={`${this.state.file}#toolbar=0&#FitH&#zoom=150`} 
                    height="84%" width="100%" scrolling='yes'></iframe>*/}
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

    //for clicking the Add Your Signature on mobile
    handleSignModalMobile(e: React.MouseEvent<HTMLButtonElement>){
        this.setState({
            isSignature: true,
            isModal: true
        })
        
    }

    //checks if bank input is needed on mobile modal and populates it
    checkNeedBankModal(){
        if(this.state.hasBank == true){
            let bankArea = (
                <div className='esign-bank-area'>
                    <text className='esign-modal-text'> Add Your Account Information</text>
                    <text className='bank-text-small'> Please provide the last 4 digits of your bank account number.</text>
                    <input className="esign-input-box-modal" maxLength={4} placeholder="Account Number" type="text" value={this.state.bankNum} onKeyPress={this.handleKeyDown} 
                onChange={this.onChangeBankAccount} id="bank"></input>
                </div>
            )
            return bankArea
        }

    }

    //to render new mobile modal for signature and initials and backbutton
    renderMobileSigningModal(){
        return (
            <div className='fullview'>
                <div className='test' id="mobile-modal">
                <div className="mobile-modal" >
                <label style={{cursor: 'pointer'}} onClick={ e => this.toggleGoBack(e)}>
                        <div style={{display: 'flex', alignItems: 'center', paddingBottom: '15px'}}>
                            <svg width="94" height="56" viewBox="0 0 94 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="1" width="92" height="54" rx="1" fill = "#F8F8F8" stroke="#F8F8F8" stroke-width="2"/>
                                <path d="M49.488 33.768C49.9307 33.768 50.312 33.7173 50.632 33.616C50.952 33.5147 51.2133 33.3733 51.416 33.192C51.624 33.0053 51.776 32.7867 51.872 32.536C51.968 32.28 52.016 32 52.016 31.696C52.016 31.104 51.8053 30.6373 51.384 30.296C50.9627 29.9493 50.3307 29.776 49.488 29.776H47.008V33.768H49.488ZM47.008 24.76V28.672H49.056C49.4933 28.672 49.872 28.624 50.192 28.528C50.5173 28.432 50.784 28.2987 50.992 28.128C51.2053 27.9573 51.3627 27.752 51.464 27.512C51.5653 27.2667 51.616 27 51.616 26.712C51.616 26.0347 51.4133 25.5413 51.008 25.232C50.6027 24.9173 49.9733 24.76 49.12 24.76H47.008ZM49.12 23.536C49.824 23.536 50.4293 23.6053 50.936 23.744C51.448 23.8827 51.8667 24.08 52.192 24.336C52.5227 24.592 52.7653 24.9067 52.92 25.28C53.0747 25.648 53.152 26.064 53.152 26.528C53.152 26.8107 53.1067 27.0827 53.016 27.344C52.9307 27.6 52.8 27.84 52.624 28.064C52.448 28.288 52.224 28.4907 51.952 28.672C51.6853 28.848 51.3707 28.992 51.008 29.104C51.8507 29.264 52.4827 29.5653 52.904 30.008C53.3307 30.4453 53.544 31.0213 53.544 31.736C53.544 32.2213 53.4533 32.664 53.272 33.064C53.096 33.464 52.8347 33.808 52.488 34.096C52.1467 34.384 51.7253 34.608 51.224 34.768C50.7227 34.9227 50.152 35 49.512 35H45.464V23.536H49.12ZM59.7388 31.352C59.0828 31.3733 58.5228 31.4267 58.0588 31.512C57.6001 31.592 57.2241 31.6987 56.9308 31.832C56.6428 31.9653 56.4321 32.1227 56.2988 32.304C56.1708 32.4853 56.1068 32.688 56.1068 32.912C56.1068 33.1253 56.1414 33.3093 56.2108 33.464C56.2801 33.6187 56.3734 33.7467 56.4908 33.848C56.6134 33.944 56.7548 34.016 56.9148 34.064C57.0801 34.1067 57.2561 34.128 57.4428 34.128C57.6934 34.128 57.9228 34.104 58.1308 34.056C58.3388 34.0027 58.5334 33.928 58.7148 33.832C58.9014 33.736 59.0774 33.6213 59.2428 33.488C59.4134 33.3547 59.5788 33.2027 59.7388 33.032V31.352ZM55.1388 28.04C55.5868 27.608 56.0694 27.2853 56.5868 27.072C57.1041 26.8587 57.6774 26.752 58.3068 26.752C58.7601 26.752 59.1628 26.8267 59.5148 26.976C59.8668 27.1253 60.1628 27.3333 60.4028 27.6C60.6428 27.8667 60.8241 28.1893 60.9468 28.568C61.0694 28.9467 61.1308 29.3627 61.1308 29.816V35H60.4988C60.3601 35 60.2534 34.9787 60.1788 34.936C60.1041 34.888 60.0454 34.7973 60.0028 34.664L59.8428 33.896C59.6294 34.0933 59.4214 34.2693 59.2188 34.424C59.0161 34.5733 58.8028 34.7013 58.5788 34.808C58.3548 34.9093 58.1148 34.9867 57.8588 35.04C57.6081 35.0987 57.3281 35.128 57.0188 35.128C56.7041 35.128 56.4081 35.0853 56.1308 35C55.8534 34.9093 55.6108 34.776 55.4028 34.6C55.2001 34.424 55.0374 34.2027 54.9148 33.936C54.7974 33.664 54.7388 33.344 54.7388 32.976C54.7388 32.656 54.8268 32.3493 55.0028 32.056C55.1788 31.7573 55.4641 31.4933 55.8588 31.264C56.2534 31.0347 56.7681 30.848 57.4028 30.704C58.0374 30.5547 58.8161 30.4693 59.7388 30.448V29.816C59.7388 29.1867 59.6028 28.712 59.3308 28.392C59.0588 28.0667 58.6614 27.904 58.1388 27.904C57.7868 27.904 57.4908 27.9493 57.2508 28.04C57.0161 28.1253 56.8108 28.224 56.6348 28.336C56.4641 28.4427 56.3148 28.5413 56.1868 28.632C56.0641 28.7173 55.9414 28.76 55.8188 28.76C55.7228 28.76 55.6401 28.736 55.5708 28.688C55.5014 28.6347 55.4428 28.5707 55.3947 28.496L55.1388 28.04ZM68.9399 28.336C68.8972 28.3947 68.8545 28.44 68.8119 28.472C68.7692 28.504 68.7105 28.52 68.6359 28.52C68.5559 28.52 68.4679 28.488 68.3719 28.424C68.2759 28.3547 68.1559 28.28 68.0119 28.2C67.8732 28.12 67.6999 28.048 67.4919 27.984C67.2892 27.9147 67.0385 27.88 66.7399 27.88C66.3399 27.88 65.9879 27.952 65.6839 28.096C65.3799 28.2347 65.1239 28.4373 64.9159 28.704C64.7132 28.9707 64.5585 29.2933 64.4519 29.672C64.3505 30.0507 64.2999 30.4747 64.2999 30.944C64.2999 31.4347 64.3559 31.872 64.4679 32.256C64.5799 32.6347 64.7372 32.9547 64.9399 33.216C65.1479 33.472 65.3959 33.6693 65.6839 33.808C65.9772 33.9413 66.3052 34.008 66.6679 34.008C67.0145 34.008 67.2999 33.968 67.5239 33.888C67.7479 33.8027 67.9319 33.7093 68.0759 33.608C68.2252 33.5067 68.3479 33.416 68.4439 33.336C68.5452 33.2507 68.6439 33.208 68.7399 33.208C68.8572 33.208 68.9479 33.2533 69.0119 33.344L69.4119 33.864C69.2359 34.0827 69.0359 34.2693 68.8119 34.424C68.5879 34.5787 68.3452 34.7093 68.0839 34.816C67.8279 34.9173 67.5585 34.992 67.2759 35.04C66.9932 35.088 66.7052 35.112 66.4119 35.112C65.9052 35.112 65.4332 35.0187 64.9959 34.832C64.5639 34.6453 64.1879 34.376 63.8679 34.024C63.5479 33.6667 63.2972 33.2293 63.1159 32.712C62.9345 32.1947 62.8439 31.6053 62.8439 30.944C62.8439 30.3413 62.9265 29.784 63.0919 29.272C63.2625 28.76 63.5079 28.32 63.8279 27.952C64.1532 27.5787 64.5505 27.288 65.0199 27.08C65.4945 26.872 66.0385 26.768 66.6519 26.768C67.2225 26.768 67.7239 26.8613 68.1559 27.048C68.5932 27.2293 68.9799 27.488 69.3159 27.824L68.9399 28.336ZM72.3725 23.216V30.152H72.7405C72.8472 30.152 72.9352 30.1387 73.0045 30.112C73.0792 30.08 73.1565 30.0187 73.2365 29.928L75.7965 27.184C75.8712 27.0933 75.9485 27.024 76.0285 26.976C76.1138 26.9227 76.2258 26.896 76.3645 26.896H77.6525L74.6685 30.072C74.5245 30.2533 74.3698 30.3947 74.2045 30.496C74.3005 30.56 74.3858 30.6347 74.4605 30.72C74.5405 30.8 74.6152 30.8933 74.6845 31L77.8525 35H76.5805C76.4578 35 76.3512 34.9813 76.2605 34.944C76.1752 34.9013 76.1005 34.8267 76.0365 34.72L73.3725 31.4C73.2925 31.288 73.2125 31.216 73.1325 31.184C73.0578 31.1467 72.9405 31.128 72.7805 31.128H72.3725V35H70.9405V23.216H72.3725Z" 
                                        fill = '#3F6DE1'/>
                                <path d="M32.75 27.858H17.925L22.4625 22.8755C22.6747 22.6422 22.7768 22.3413 22.7463 22.0391C22.7158 21.737 22.5553 21.4582 22.3 21.2643C22.0447 21.0703 21.7156 20.977 21.3851 21.0048C21.0546 21.0327 20.7497 21.1795 20.5375 21.4128L14.2875 28.2694C14.2455 28.3239 14.2078 28.3812 14.175 28.4408C14.175 28.4979 14.175 28.5322 14.0875 28.5893C14.0308 28.7203 14.0012 28.8598 14 29.0007C14.0012 29.1416 14.0308 29.2811 14.0875 29.4121C14.0875 29.4692 14.0875 29.5035 14.175 29.5607C14.2078 29.6202 14.2455 29.6775 14.2875 29.7321L20.5375 36.5886C20.655 36.7176 20.8022 36.8213 20.9686 36.8924C21.1349 36.9635 21.3164 37.0003 21.5 37C21.7921 37.0005 22.0751 36.9075 22.3 36.7372C22.4266 36.6412 22.5312 36.5234 22.6079 36.3905C22.6846 36.2575 22.7318 36.112 22.7469 35.9623C22.762 35.8127 22.7447 35.6617 22.6959 35.5182C22.6471 35.3747 22.5678 35.2414 22.4625 35.1259L17.925 30.1435H32.75C33.0815 30.1435 33.3995 30.0231 33.6339 29.8088C33.8683 29.5945 34 29.3038 34 29.0007C34 28.6976 33.8683 28.407 33.6339 28.1927C33.3995 27.9784 33.0815 27.858 32.75 27.858Z" 
                                        fill =  '#3F6DE1'/>
                            </svg>
                        </div>
                </label>
                    <div >
                        area for optional bank area
                        {this.checkNeedBankModal()}
                    </div>
                    <div className='esign-modal-text'> Add Your Signature </div>
                    <input className="esign-input-box-modal" placeholder="Your Initials" type="text" value={this.state.initials} onKeyPress={this.handleKeyDown} onChange={this.onChangeInitials} id="initial"></input>
                    <input className="esign-input-box-modal" placeholder="Your Full Name" type="text" value={this.state.signature} onKeyPress={this.handleKeyDown} onChange={this.onChangeSignature} id="signature"></input>
                <div className="button-area-modal">
                    <button  id="sign-btn" className="gideon-submit-button" onClick={e => this.clickToSubmitSignature(e)}> Add Your Signature </button>
                </div>
            </div>
                </div> 
            </div>)
    }

    //handles toogling back button, which in turn triggers switching back to pdf viewer
    toggleGoBack(e: React.MouseEvent<HTMLLabelElement>){
        this.setState({
            isModal: false,
            isSignature: false,
        })
    }


    scrollToElement(){
        var scrollTo = document.getElementById("sign-area");
        scrollTo.scrollIntoView({behavior:'smooth',block:'start'})
    }

    //determines if input areas for 
    toggleBankInput(){

    }

    //submits bank number, for non mobile takes to other sticky footer area
    submitBankNumber(e: React.MouseEvent<HTMLButtonElement>){
        if(this.state.bankNum != ''){
            this.setState({
                isNext: true
                
            })

        }
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
                        {this.props.presignText}
                    </div>
                </div> 
                <button type="button" className="gideon-submit-button-presign" id="sign_btn" onClick={e => this.handleSign(e)}>
                     <EsignPen/> Review & Sign
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
                        {this.props.presignText}
                    </div>
                </div> 
                <button type="button" className="gideon-submit-button-presign" id="sign_btn" onClick={e => this.handleSign(e)}>
                     <EsignPen/> Review & Sign 
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
                <div className='esign-black-text-mobile'>
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
        if(this.state.hasBank == true && this.state.isNext == false && isMobile == false){
            let sig = (
                <footer className="signature-box-area">
            <div className="submit-area2">
                <div className = "esign-black-text" style={{ display: "block"}}> <br></br>
                    Add Your Account Information
                    <text className='bank-text-small-desktop'> Please provide the last 4 digits of your bank account number.</text>
                </div>
                <div className='submit-area'>
                <input className="esign-input-box-bank" maxLength={4} placeholder="Account Number" style= {{width: "100%"}} type="text" value={this.state.bankNum} onKeyPress={this.handleKeyDown} onChange={this.onChangeBankAccount} id="signature"></input>
                <div className="button-area">
                    <button  id="sign-btn" className="gideon-submit-button" style={{width: "80%" }} onClick={e => this.submitBankNumber(e)}> Next  </button>
                </div>
                </div>
            </div>
           </footer> 
            )
            return sig
        } else {
            if ( isMobile ) {
                let sig = (
                    <footer className="signature-box-area">
                    <div className="submit-area">
                        <div className="button-area">
                            <button  id="sign-btn" className="gideon-submit-button" style={{width: "100%", marginBottom: "5%" }} onClick={e => this.handleSignModalMobile(e)}> SIGN </button>
                        </div>
                    </div>
                   </footer>   
                )
                return sig;
            }
    
            else {
            let sig = (
                <footer className="signature-box-area">
                <div className="submit-area2">
                <div className = "esign-black-text" style={{ display: "block"}}> <br></br>
                    Add Your Signature
                </div>
                <div className='submit-area'> 
                <input className="esign-initial-box" placeholder="Your Initials" type="text" value={this.state.initials} onKeyPress={this.handleKeyDown} onChange={this.onChangeInitials} id="initial"></input>
                    <input className="esign-input-box" placeholder="Type in Full Name to Create Signature" type="text" value={this.state.signature} onKeyPress={this.handleKeyDown} onChange={this.onChangeSignature} id="signature"></input>
                    <div className="button-area">
                        <button  id="sign-btn" className="gideon-submit-button" style={{width: "80%" }} onClick={e => this.clickToSubmitSignature(e)}> Sign Now  </button>
                    </div>
                </div>
                </div>
               </footer>   
            )
            return sig
            }

        }
    }

    renderPopup(){
        const {willSubmit, completedDoc, isSignature, isFullHeight, isFullscreen} = this.state;
            //normal screen
            if(document.getElementById('btn3') != null){
                document.getElementById('btn3').style.display = "none"
            }
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
        // if(isFullscreen == true){
        //     //fullheight css
        //     esignPopup = (
        //         <div className="modal-fullscreen">
        //         <div className="modal-content-full">
        //         <div className="presign_area_full">
        //                 <EsignPreSignFull />
        //         </div>
        //         <div className="esign__card gideon__node">
        //         {willSubmit == false && this.renderStartingScreen()}
        //         {/*willSubmit == true && completedDoc == false && this.renderLargerPdf()*/}
        //         {/*willSubmit == true && completedDoc == true && this.renderCompletedDoc() */}
        //         {/*isSignature == true && this.renderSignatureModal()*/}
    
        //     </div>
        //         </div>
        //     </div>
        //     )
        // }
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
       // let blank_div = document.createElement("div")
       // blank_div.setAttribute("class","wc-console")
       // document.appendChild(blank_div)
      //  console.log("after add blank")
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
        const {willSubmit, completedDoc, loading, isModal} = this.state;

        return (
            <div className='esign_fullwindow'>
                {willSubmit == true && completedDoc == false && isModal == false && this.renderLargerPdf()}
                {isModal == true && this.renderMobileSigningModal()}

            </div>
        )
    }

    //screen 1: message + button to sign
    //screen 2: document viewable + signature box

    render() {
        const {willSubmit, completedDoc, isPopup, isDocument, isSignature, isModal} = this.state;
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
        console.log("own props:")
        console.log(ownProps)
        console.log("state props:")
        console.log(stateProps)
        console.log("dispatch props:")
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
            document: ownProps.activity.entities[0].pdf_link.pdf_link[0],
            docx: ownProps.activity.entities[0].pdf_link.docx_link[0],
            prompt: ownProps.text,
            addFilesToState: ownProps.addFilesToState,
            index: ownProps.index,
            fullheight: ownProps.format.full_height,
            fullscreen: ownProps.format.fullscreen,
            accountNum: ownProps.activity.entities[0].pdf_link.account_num,
            presignText: ownProps.activity.text
        }
    }
)(Esign);