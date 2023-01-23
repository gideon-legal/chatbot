import { DirectLineOptions } from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import { NodeHeader } from './nodes/containers/NodeHeader';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';

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

}


class Esign extends React.Component<EsignProps, EsignState> {
    constructor(props: EsignProps){
        super(props);

        this.state = {
            file: '',
            signature: '',
            signatureError: '',
            formattedMessage: ''

        }
    }

} 

//export const EsignCard = connect(
 //   (state: ChatState) => ({

 //   })

//)(Esign);