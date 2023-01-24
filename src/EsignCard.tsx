import { DirectLineOptions } from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import { NodeHeader } from './nodes/containers/NodeHeader';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import { connect } from 'react-redux';

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


}

export interface EsignState {
    file: any;
    signature: string;
    signatureError: string;
    formattedMessage: string;
    phase: string;

}


class Esign extends React.Component<EsignProps, EsignState> {
    constructor(props: EsignProps){
        super(props);

        this.state = {
            file: '',
            signature: '',
            signatureError: '',
            formattedMessage: '',
            phase: ''

        }

        //handleKeyDown here etc
    }
  
    /** Gets document to view and sign */
    getDocument = () => {

    }

    /** Validates inputted signature */
    validateSignature = () => {

    }

    /** For submit button for signature */
    clickToSubmitSignature(){

    }

    /** for skipping signature signing */
    clickSignLater() {

    }

    renderDocument = () => {

        return (
            <div className='esign-inner-container'>
                <section className="document-box">

                </section>
                


             <div>
            <button type="button" className="gideon-submit-button">
                Signatue
            </button>
          </div>
          <div>
            <button type="button" className="gideon-submit-button">
                Sign Later
            </button>
          </div>
            </div>
        )

    }

    //screen 1: message + button to sign
    //screen 2: document viewable + signature box

    render() {
    
        

        return (
            <div className="esign__card gideon__node">
                <NodeHeader
                header="Esign Document"
                
                />
                { this.renderDocument()}
               
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
        return {
            // from stateProps
            node: ownProps.node,
            // from dispatchProps
            sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
            gid: ownProps.gid,
            directLine: ownProps.directLine,
            conversationId: stateProps.conversationId
        }
    }
)(Esign);