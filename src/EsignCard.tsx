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
    document: string;


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
            willSubmit: false

        }

        //handleKeyDown here etc
        this.onChangeSignature = this.onChangeSignature.bind(this)
    }
  
    /** Gets document to view and sign */
    getDocument = () => {

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
            signError
        })

        return validated;

    }

    /** For submit button for signature */
    clickToSubmitSignature(e: React.MouseEvent<HTMLButtonElement>){
        if(!this.validateSignature()) { return;}

        //need to send to api so it can be used to populate document
        console.log("obtained signature")
        console.log(this.state.signature)

    }

    onChangeSignature(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            ...this.state,
            signature: event.target.value
        })
        console.log("changed signature")
        console.log(this.state.signature)
    }


    //switch from signing icon to document box when done loading
    renderSigningIcon = () => {
        return (
            <div className='signature-image-box'>
                <svg viewBox="0 0 406 125" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="404.875" height="124.464" transform="translate(0.696411 0.25)" fill="#F8F8F8"/>
<rect x="181.491" y="75.2646" width="20.1335" height="12.5461" fill="url(#pattern0)"/>
<path d="M203.191 83.3196C203.79 83.0942 204.843 82.6219 204.844 82.6219C205.955 82.0662 206.535 80.8565 207.232 79.6293C207.968 78.3315 210.269 77.8088 211.764 77.4092C212.876 77.1125 214.02 76.7438 215.16 76.4995C217.412 76.0172 218.975 75.4635 218.777 73.2998C218.625 71.6642 218 73.0307 215.941 72.6425C214.675 72.4043 212.583 73.0811 211.561 73.5911C209.815 74.4617 208.301 72.2543 206.535 73.1074C204.925 73.8851 204.106 73.8777 202.352 73.3973C201.625 73.1989 201.3 72.9883 200.601 73.1571C198.137 73.7532 195.012 74.5081 193.229 76.0939C192.774 76.4975 190.079 80.8908 190.634 80.9783C192.088 81.2077 193.203 80.7657 194.176 79.9059C194.641 79.4941 194.971 78.9902 195.369 78.5354C197.626 75.9519 200.585 83.4171 201.239 83.6143C202.027 83.8511 202.614 83.5362 203.191 83.3196Z" fill="#ED9B88"/>
<path d="M186.988 84.9128C187.076 85.2781 188.149 85.6925 188.676 85.9987C189.507 86.4797 191.776 87.5696 192.669 87.281C193.698 86.9446 192.567 85.7834 191.85 85.2505C191.191 84.7614 190.299 84.0785 189.089 84.0092C188.32 83.9655 186.899 84.5333 186.988 84.9128Z" fill="#ED9B88"/>
<path d="M197.997 78.4531C199.728 79.4421 201.153 79.3096 203.176 79.5693C203.993 79.6736 204.063 80.0597 203.377 80.4903C202.87 80.8086 202.888 81.2035 202.2 81.4511C200.74 81.9752 200.79 82.5275 200.56 82.1555C200.098 81.4053 199.569 80.3477 199.569 80.3477C199.294 79.8814 198.976 79.4362 198.617 79.0169C198.67 78.9382 197.915 78.4935 197.997 78.4531Z" fill="#D18174"/>
<path d="M222.658 8.70117H175.651V62.7932H222.658V8.70117Z" fill="#EFEFEF"/>
<g opacity="0.4">
<path d="M211.083 15.7588H188.634V18.5286H211.083V15.7588Z" fill="#00C7E3"/>
</g>
<g opacity="0.6">
<path d="M216.773 23.2451H181.119V24.9762H216.773V23.2451Z" fill="#98AAB7"/>
</g>
<g opacity="0.6">
<path d="M216.784 28.4336H181.129V30.1647H216.784V28.4336Z" fill="#98AAB7"/>
</g>
<g opacity="0.6">
<path d="M216.795 34.3125H181.14V36.0436H216.795V34.3125Z" fill="#98AAB7"/>
</g>
<g opacity="0.6">
<path d="M216.805 39.8447H181.15V41.5758H216.805V39.8447Z" fill="#98AAB7"/>
</g>
<path d="M199.364 53.1124L199.94 52.7041C201.472 51.6168 202.142 50.5949 201.882 49.7478C201.622 48.9008 200.396 48.2502 198.681 48.0356C196.342 47.7429 193.215 48.3141 191.877 50.2558L191.488 50.0459C192.934 47.9454 196.263 47.3224 198.745 47.6326C200.67 47.8735 202.01 48.6229 202.322 49.6382C202.517 50.2733 202.388 51.273 200.818 52.5641C202.902 52.1948 204.903 50.9171 205.667 49.402L206.146 48.452L206.102 49.4922C206.133 49.6695 206.176 49.8448 206.233 50.017C206.338 50.3816 206.461 50.8142 206.499 51.1755C206.76 51.0813 207.065 50.9864 207.382 50.8875C208.182 50.6379 209.088 50.3547 209.514 50.027L210.007 49.6483L209.888 50.2161C209.757 50.8411 209.725 51.6337 210.317 51.8644C211.272 52.2365 213.456 51.1277 214.39 50.0291L214.754 50.2719C214.268 50.8445 213.433 51.452 212.575 51.857C211.999 52.1261 210.916 52.5392 210.134 52.2338C209.434 51.9647 209.307 51.2636 209.369 50.5996C208.855 50.8552 208.163 51.0705 207.533 51.2683C207.088 51.4076 206.666 51.5374 206.374 51.6639L206.009 51.82L206.048 51.4621C206.086 51.1358 205.916 50.5464 205.792 50.1165C205.787 50.1017 205.783 50.0876 205.78 50.0741C204.678 51.6599 202.356 52.9052 200.1 53.0586L199.364 53.1124Z" fill="#F6473E"/>
<path d="M217.715 15.9248L208.42 41.8008L209.22 42.5887L210.163 42.9156L211.217 43.0576L220.438 17.0457L217.715 15.9248Z" fill="#00C7E3"/>
<path d="M212.998 28.8749C212.998 28.8749 215.565 29.7959 215.909 30.0698L216.068 29.6062C216.068 29.6062 213.57 28.3488 213.151 28.4349L212.998 28.8749Z" fill="#F6473E"/>
<path d="M217.076 17.5891C217.076 17.5891 219.642 18.5101 219.986 18.7846L220.146 18.3211C220.146 18.3211 217.647 17.0636 217.229 17.1497L217.076 17.5891Z" fill="#F6473E"/>
<path d="M219.939 18.744C219.939 18.744 220.719 19.1994 220.58 19.9213C220.359 21.0651 220.197 21.059 219.658 21.6625C218.363 23.1104 217.75 23.586 218.095 24.8246L218.297 24.7533C218.297 24.7533 218.268 23.6244 220.002 22.0938C221.736 20.5632 221.468 18.5731 220.045 18.2959L219.939 18.744Z" fill="#F6473E"/>
<path d="M208.63 42.0312L209.451 43.5322H208.63V42.0312Z" fill="#3A56A5"/>
<path d="M208.652 42.0078L209.486 43.5323H209.451L208.63 42.0314V42.0078H208.652Z" fill="#3A56A5"/>
<path d="M208.687 42.0078L209.521 43.5323H209.486L208.652 42.0078H208.687Z" fill="#3859A6"/>
<path d="M208.722 42.0078L209.556 43.5323H209.521L208.687 42.0078H208.722Z" fill="#375CA7"/>
<path d="M208.757 42.0078L209.591 43.5323H209.556L208.722 42.0078H208.757Z" fill="#355EA9"/>
<path d="M208.793 42.0078L209.626 43.5323H209.591L208.757 42.0078H208.793Z" fill="#3461AA"/>
<path d="M208.827 42.0078L209.662 43.5323H209.626L208.792 42.0078H208.827Z" fill="#3263AB"/>
<path d="M208.863 42.0078L209.697 43.5323H209.662L208.828 42.0078H208.863Z" fill="#3165AC"/>
<path d="M208.898 42.0078L209.732 43.5323H209.697L208.863 42.0078H208.898Z" fill="#2F67AD"/>
<path d="M208.933 42.0078L209.767 43.5323H209.732L208.898 42.0078H208.933Z" fill="#2E6AAE"/>
<path d="M208.968 42.0078L209.802 43.5323H209.767L208.933 42.0078H208.968Z" fill="#2D6CAF"/>
<path d="M209.004 42.0078L209.838 43.5323H209.802L208.968 42.0078H209.004Z" fill="#2C6EB0"/>
<path d="M209.039 42.0078L209.873 43.5323H209.838L209.004 42.0078H209.039Z" fill="#2A6FB0"/>
<path d="M209.074 42.0078L209.908 43.5323H209.873L209.039 42.0078H209.074Z" fill="#2971B1"/>
<path d="M209.109 42.0078L209.944 43.5323H209.908L209.074 42.0078H209.109Z" fill="#2873B2"/>
<path d="M209.144 42.0078L209.979 43.5323H209.944L209.109 42.0078H209.144Z" fill="#2774B3"/>
<path d="M209.179 42.0078L210.014 43.5323H209.979L209.144 42.0078H209.179Z" fill="#2776B3"/>
<path d="M209.215 42.0078L210.049 43.5323H210.014L209.179 42.0078H209.215Z" fill="#2677B4"/>
<path d="M209.25 42.0078L210.084 43.5323H210.049L209.215 42.0078H209.25Z" fill="#2579B5"/>
<path d="M209.285 42.0078L210.115 43.5249L210.098 43.5323H210.084L209.25 42.0078H209.285Z" fill="#247AB5"/>
<path d="M209.32 42.0078L210.143 43.5128L210.115 43.5249L209.285 42.0078H209.32Z" fill="#237BB6"/>
<path d="M209.355 42.0078L210.172 43.5007L210.143 43.5128L209.32 42.0078H209.355Z" fill="#237CB6"/>
<path d="M209.39 42.0078L210.2 43.4886L210.172 43.5007L209.355 42.0078H209.39Z" fill="#227DB7"/>
<path d="M209.426 42.0078L210.229 43.4765L210.2 43.4886L209.39 42.0078H209.426Z" fill="#217EB7"/>
<path d="M209.461 42.0078L210.257 43.4637L210.229 43.4765L209.426 42.0078H209.461Z" fill="#217FB7"/>
<path d="M209.497 42.0078L210.286 43.4516L210.257 43.4637L209.461 42.0078H209.497Z" fill="#2080B8"/>
<path d="M209.532 42.0078L210.314 43.4395L210.286 43.4516L209.497 42.0078H209.532Z" fill="#2081B8"/>
<path d="M209.566 42.0078L210.343 43.4274L210.314 43.4395L209.531 42.0078H209.566Z" fill="#1F81B9"/>
<path d="M209.602 42.0078L210.372 43.4153L210.343 43.4274L209.567 42.0078H209.602Z" fill="#1F82B9"/>
<path d="M209.637 42.0078L210.4 43.4025L210.372 43.4153L209.602 42.0078H209.637Z" fill="#1F83B9"/>
<path d="M209.672 42.0078L210.429 43.3904L210.4 43.4025L209.637 42.0078H209.672Z" fill="#1E83B9"/>
<path d="M209.708 42.0078L210.457 43.3783L210.429 43.3904L209.672 42.0078H209.708Z" fill="#1E84BA"/>
<path d="M209.742 42.0078L210.486 43.3662L210.457 43.3783L209.708 42.0078H209.742Z" fill="#1E84BA"/>
<path d="M209.778 42.0078L210.514 43.3541L210.486 43.3662L209.743 42.0078H209.778Z" fill="#1D85BA"/>
<path d="M209.813 42.0078L210.543 43.3413L210.514 43.3541L209.778 42.0078H209.813Z" fill="#1D85BA"/>
<path d="M209.848 42.0078L210.571 43.3292L210.543 43.3413L209.813 42.0078H209.848Z" fill="#1D85BA"/>
<path d="M209.883 42.0078L210.6 43.3171L210.571 43.3292L209.848 42.0078H209.883Z" fill="#1D86BA"/>
<path d="M209.919 42.0078L210.628 43.3049L210.6 43.3171L209.883 42.0078H209.919Z" fill="#1D86BB"/>
<path d="M209.954 42.0078L210.657 43.2928L210.628 43.3049L209.919 42.0078H209.954Z" fill="#1C86BB"/>
<path d="M209.989 42.0078L210.685 43.2801L210.657 43.2928L209.954 42.0078H209.989Z" fill="#1C86BB"/>
<path d="M210.024 42.0078L210.714 43.2679L210.685 43.2801L209.989 42.0078H210.024Z" fill="#1C87BB"/>
<path d="M210.059 42.0078L210.742 43.2558L210.714 43.2679L210.024 42.0078H210.059Z" fill="#1C87BB"/>
<path d="M210.094 42.0078L210.77 43.2437L210.742 43.2558L210.059 42.0078H210.094Z" fill="#1C87BB"/>
<path d="M210.13 42.0078L210.799 43.2316L210.771 43.2437L210.094 42.0078H210.13Z" fill="#1C87BB"/>
<path d="M210.165 42.0078L210.828 43.2188L210.799 43.2316L210.13 42.0078H210.165Z" fill="#1C87BB"/>
<path d="M210.2 42.0078L210.856 43.2067L210.828 43.2188L210.165 42.0078H210.2Z" fill="#1C87BB"/>
<path d="M210.235 42.0078L210.884 43.1946L210.855 43.2067L210.199 42.0078H210.235Z" fill="#1C87BB"/>
<path d="M210.27 42.0078L210.911 43.1791V43.1832L210.884 43.1946L210.235 42.0078H210.27Z" fill="#1C87BB"/>
<path d="M210.305 42.0078L210.911 43.1145V43.1791L210.27 42.0078H210.305Z" fill="#1C87BB"/>
<path d="M210.34 42.0078L210.911 43.05V43.1145L210.305 42.0078H210.34Z" fill="#1C87BB"/>
<path d="M210.911 43.05L210.341 42.0078H210.911V43.05Z" fill="#1C87BB"/>
<path d="M208.937 44.6641L208.99 44.7622H208.937V44.6641Z" fill="#3A56A5"/>
<path d="M208.937 44.5791L209.037 44.7628H208.991L208.937 44.6632V44.5791Z" fill="#3A56A5"/>
<path d="M208.937 44.4951L209.084 44.7629H209.037L208.937 44.5792V44.4951Z" fill="#3859A6"/>
<path d="M208.937 44.4111L209.129 44.763H209.084L208.937 44.4952V44.4111Z" fill="#375CA7"/>
<path d="M208.937 44.3262L209.171 44.7547L209.153 44.7621H209.129L208.937 44.4103V44.3262Z" fill="#355EA9"/>
<path d="M208.937 44.2422L209.208 44.7387L209.171 44.7549L208.937 44.3263V44.2422Z" fill="#3461AA"/>
<path d="M208.937 44.1592L209.245 44.7243L209.208 44.7398L208.937 44.2433V44.1592Z" fill="#3263AB"/>
<path d="M208.937 44.0752L209.283 44.7076L209.246 44.7238L208.937 44.1586V44.0752Z" fill="#3165AC"/>
<path d="M208.937 43.9912L209.32 44.6916L209.283 44.7077L208.937 44.0753V43.9912Z" fill="#2F67AD"/>
<path d="M208.937 43.9062L209.357 44.6746L209.32 44.6907L208.937 43.9903V43.9062Z" fill="#2E6AAE"/>
<path d="M208.937 43.8232L209.394 44.6602L209.357 44.6757L208.937 43.9073V43.8232Z" fill="#2D6CAF"/>
<path d="M208.937 43.7383L209.432 44.6432L209.394 44.6593L208.937 43.8224V43.7383Z" fill="#2C6EB0"/>
<path d="M208.937 43.6533L209.469 44.6262L209.432 44.6423L208.937 43.7374V43.6533Z" fill="#2A6FB0"/>
<path d="M208.937 43.5703L209.506 44.6111L209.469 44.6273L208.937 43.6544V43.5703Z" fill="#2971B1"/>
<path d="M208.937 43.4863L209.543 44.5951L209.506 44.6112L208.937 43.5704V43.4863Z" fill="#2873B2"/>
<path d="M208.937 43.4014L209.58 44.5787L209.543 44.5942L208.937 43.4855V43.4014Z" fill="#2774B3"/>
<path d="M208.937 43.3193L209.618 44.564L209.58 44.5801L208.937 43.4028V43.3193Z" fill="#2776B3"/>
<path d="M208.937 43.2344L209.655 44.547L209.618 44.5631L208.937 43.3185V43.2344Z" fill="#2677B4"/>
<path d="M208.937 43.1504L209.693 44.5309L209.655 44.5471L208.937 43.2345V43.1504Z" fill="#2579B5"/>
<path d="M208.937 43.0654L209.73 44.5146L209.693 44.5301L208.937 43.1495V43.0654Z" fill="#247AB5"/>
<path d="M208.937 42.9824L209.767 44.4996L209.73 44.5157L208.937 43.0665V42.9824Z" fill="#237BB6"/>
<path d="M208.937 42.8984L209.804 44.4835L209.767 44.4997L208.937 42.9825V42.8984Z" fill="#237CB6"/>
<path d="M208.937 42.8135L209.841 44.4665L209.804 44.4827L208.937 42.8976V42.8135Z" fill="#227DB7"/>
<path d="M208.937 42.7305L209.879 44.4515L209.841 44.4676L208.937 42.8146V42.7305Z" fill="#217EB7"/>
<path d="M208.937 42.6455L209.916 44.4351L209.879 44.4506L208.937 42.7296V42.6455Z" fill="#217FB7"/>
<path d="M208.937 42.5625L209.953 44.4194L209.916 44.4355L208.937 42.6459V42.5625Z" fill="#2080B8"/>
<path d="M208.968 42.5352L209.99 44.4028L209.953 44.419L208.937 42.5621V42.5352H208.968Z" fill="#2081B8"/>
<path d="M209.014 42.5352L210.027 44.3867L209.99 44.4028L208.968 42.5352H209.014Z" fill="#1F81B9"/>
<path d="M209.06 42.5352L210.064 44.3712L210.027 44.3867L209.014 42.5352H209.06Z" fill="#1F82B9"/>
<path d="M209.106 42.5352L210.102 44.355L210.065 44.3712L209.061 42.5352H209.106Z" fill="#1F83B9"/>
<path d="M209.152 42.5352L210.139 44.3389L210.102 44.355L209.106 42.5352H209.152Z" fill="#1E83B9"/>
<path d="M209.198 42.5352L210.176 44.3227L210.139 44.3389L209.152 42.5352H209.198Z" fill="#1E84BA"/>
<path d="M209.244 42.5352L210.213 44.3066L210.176 44.3227L209.198 42.5352H209.244Z" fill="#1E84BA"/>
<path d="M209.29 42.5352L210.251 44.2911L210.213 44.3066L209.244 42.5352H209.29Z" fill="#1D85BA"/>
<path d="M209.336 42.5352L210.288 44.275L210.251 44.2911L209.29 42.5352H209.336Z" fill="#1D85BA"/>
<path d="M209.382 42.5352L210.325 44.2588L210.287 44.275L209.335 42.5352H209.382Z" fill="#1D85BA"/>
<path d="M209.428 42.5352L210.362 44.2427L210.325 44.2588L209.382 42.5352H209.428Z" fill="#1D86BA"/>
<path d="M209.474 42.5352L210.399 44.2272L210.362 44.2427L209.428 42.5352H209.474Z" fill="#1D86BB"/>
<path d="M209.52 42.5352L210.432 44.2023V44.2131L210.4 44.2272L209.474 42.5352H209.52Z" fill="#1C86BB"/>
<path d="M209.566 42.5352L210.432 44.1182V44.2023L209.52 42.5352H209.566Z" fill="#1C86BB"/>
<path d="M209.612 42.5352L210.432 44.0341V44.1182L209.566 42.5352H209.612Z" fill="#1C87BB"/>
<path d="M209.658 42.5352L210.432 43.95V44.0341L209.612 42.5352H209.658Z" fill="#1C87BB"/>
<path d="M209.704 42.5352L210.432 43.8659V43.95L209.658 42.5352H209.704Z" fill="#1C87BB"/>
<path d="M209.75 42.5352L210.432 43.7818V43.8659L209.704 42.5352H209.75Z" fill="#1C87BB"/>
<path d="M209.796 42.5352L210.432 43.6977V43.7818L209.749 42.5352H209.796Z" fill="#1C87BB"/>
<path d="M209.841 42.5352L210.432 43.6136V43.6977L209.796 42.5352H209.841Z" fill="#1C87BB"/>
<path d="M209.888 42.5352L210.432 43.5295V43.6136L209.842 42.5352H209.888Z" fill="#1C87BB"/>
<path d="M209.934 42.5352L210.432 43.4461V43.5295L209.888 42.5352H209.934Z" fill="#1C87BB"/>
<path d="M209.98 42.5352L210.432 43.362V43.4461L209.934 42.5352H209.98Z" fill="#1C87BB"/>
<path d="M210.026 42.5352L210.432 43.2779V43.362L209.979 42.5352H210.026Z" fill="#1C87BB"/>
<path d="M210.432 43.2779L210.026 42.5352H210.432V43.2779Z" fill="#1C87BB"/>
<path d="M218.029 16.0539L218.161 15.7256L220.192 16.58L220.085 16.9003" fill="#2266AA"/>
<path d="M238.312 86.9898C238.312 86.9898 261.454 86.7456 264.471 84.6277C267.489 82.5097 272.814 100.785 270.105 101.996C246.278 112.652 238.775 97.8445 238.775 97.8445" fill="#0C1027"/>
<path d="M248.919 29.8827C248.919 29.8827 249.993 33.6651 250.324 35.3713C250.324 35.3713 250.937 33.1881 252.249 33.1511C253.561 33.1141 253.821 34.0042 253.853 34.2403C253.886 34.4765 254.734 29.1897 252.822 27.8219C250.909 26.4542 250.64 27.3564 250.64 27.3564L248.408 29.2449" fill="#68221E"/>
<path d="M241.044 44.5385C241.11 43.8314 240.437 42.7893 240.643 42.2187C240.875 41.5762 241.944 41.1988 242.607 41.0205C243.594 40.7568 244.997 40.1587 246.034 40.1762C247.173 40.195 246.978 40.8099 247.119 41.6919C247.241 42.4596 247.456 43.1532 247.704 43.8745C248.096 45.0142 249.693 47.418 248.843 48.4925C248.202 49.2998 246.261 50.86 245.14 50.9454C243.99 51.0336 242.507 50.0466 241.394 49.869C241.328 48.9688 241.85 48.2207 241.687 47.2209C241.625 46.8468 241.44 46.1714 241.268 45.4656C241.022 44.4564 240.802 43.3847 241.019 43.0658" fill="#ED9B88"/>
<path d="M243.287 44.1863C246.148 43.6844 248.035 42.5319 249.026 40.3857C249.233 39.9349 249.295 39.242 249.589 38.8551C250.263 37.9677 251.987 37.7645 252.814 36.7796C253.62 35.8215 254.463 34.408 253.359 33.4601C252.151 32.4213 250.292 33.8792 250.45 35.0344C250.175 33.3295 249.96 31.2923 248.936 29.7692C248.158 28.6093 246.21 29.0506 244.659 28.9551C243.596 28.8878 242.525 28.8286 241.465 28.7425C240.782 28.6873 239.408 28.3173 238.792 28.4397C237.386 28.7189 236.655 30.6936 236.2 31.6159C235.414 33.2071 235.344 35.0021 235.622 36.6618C235.809 37.7834 235.617 38.9116 235.942 40.0318C236.701 42.6362 239.709 44.8153 243.287 44.1863Z" fill="#ED9B88"/>
<path d="M243.292 33.7154L243.017 33.4839C243.897 32.6631 246.823 32.8549 247.757 33.3218L247.57 33.6151C246.697 33.1778 243.979 33.0749 243.292 33.7154Z" fill="black"/>
<path d="M239.257 33.8508C238.623 33.3529 237.44 33.2083 235.64 33.4074L235.593 33.071C237.508 32.8591 238.788 33.0306 239.508 33.5965L239.257 33.8508Z" fill="black"/>
<path d="M239.767 38.8198C239.291 38.8198 239.043 38.6281 238.927 38.4895C238.641 38.1531 238.676 37.6149 239.017 37.119C239.196 36.8613 239.392 36.6218 239.582 36.3897C240.049 35.8192 240.493 35.281 240.569 34.5947L240.797 34.6149C240.712 35.355 240.253 35.9154 239.768 36.5081C239.581 36.7369 239.389 36.9737 239.212 37.2246C238.925 37.6398 238.884 38.0993 239.111 38.3684C239.318 38.614 239.723 38.6806 240.249 38.5547L240.308 38.7499C240.132 38.794 239.95 38.8175 239.767 38.8198Z" fill="#842E26"/>
<path d="M239.662 40.4768C240.033 41.1153 240.453 41.7356 241.419 41.8116C242.421 41.8903 243.718 41.2929 243.709 40.4082C242.385 40.5192 240.917 40.7432 239.662 40.4768Z" fill="#842E26"/>
<path d="M245.155 35.1425C245.155 35.3733 245.011 35.563 244.829 35.567C244.647 35.5711 244.499 35.3874 244.497 35.1573C244.494 34.9272 244.64 34.7375 244.822 34.7335C245.005 34.7294 245.153 34.9097 245.155 35.1425Z" fill="black"/>
<path d="M244.824 35.7646C244.695 35.7635 244.572 35.7173 244.481 35.6361C244.412 35.5722 244.357 35.4968 244.32 35.4141C244.284 35.3314 244.266 35.2432 244.268 35.1544C244.268 34.81 244.505 34.5341 244.816 34.5274C244.881 34.5266 244.947 34.5376 245.007 34.5595C245.068 34.5815 245.123 34.614 245.17 34.6552C245.31 34.7845 245.386 34.9577 245.382 35.1369C245.382 35.4814 245.145 35.7572 244.835 35.7646H244.824ZM244.824 34.9304C244.798 34.9304 244.719 35.0104 244.721 35.1511C244.717 35.2225 244.744 35.2925 244.797 35.3468C244.804 35.3533 244.812 35.3582 244.822 35.361C244.848 35.361 244.927 35.2809 244.925 35.1403C244.928 35.0691 244.901 34.9995 244.849 34.9452C244.843 34.9384 244.834 34.9333 244.824 34.9304Z" fill="black"/>
<path d="M237.71 34.8392C237.71 35.0686 237.567 35.2583 237.385 35.263C237.203 35.2677 237.055 35.0834 237.052 34.8533C237.05 34.6232 237.196 34.4328 237.378 34.4288C237.56 34.4247 237.709 34.6091 237.71 34.8392Z" fill="black"/>
<path d="M237.38 35.4638C237.251 35.4625 237.129 35.4166 237.038 35.336C236.968 35.2722 236.914 35.1967 236.877 35.1141C236.84 35.0314 236.823 34.9431 236.825 34.8543C236.825 34.5085 237.062 34.2327 237.373 34.2266C237.438 34.2258 237.503 34.2367 237.564 34.2585C237.624 34.2804 237.679 34.3128 237.726 34.3538C237.866 34.4833 237.942 34.6567 237.938 34.8361C237.938 35.1806 237.701 35.4558 237.391 35.4625L237.38 35.4638ZM237.384 34.6296C237.358 34.6296 237.279 34.7097 237.28 34.8509C237.277 34.9222 237.304 34.9919 237.356 35.0461C237.363 35.0528 237.371 35.0577 237.381 35.0602C237.407 35.0602 237.486 34.9801 237.484 34.8395C237.488 34.7681 237.461 34.6982 237.408 34.6437C237.402 34.6372 237.394 34.6323 237.384 34.6296Z" fill="black"/>
<path d="M240.362 41.3932C240.362 41.3932 242.008 41.1012 242.872 41.4564C242.872 41.4564 241.643 42.4185 240.362 41.3932Z" fill="#B7331D"/>
<path d="M252.179 34.0318C251.197 34.0574 251.111 35.0087 250.965 35.6035C251.192 35.3673 251.595 35.3344 251.538 35.6768C251.486 35.9903 250.956 36.0085 250.843 36.1975C250.501 36.7748 252 36.3994 252.274 36.246C252.936 35.8692 253.366 35.2247 253.058 34.5714C252.924 34.2889 252.112 33.5192 251.828 34.12" fill="#D18478"/>
<path d="M240.887 44.1964C240.887 44.1964 243.685 45.2526 247.16 42.6934C247.16 42.6934 247.395 44.5099 248.046 45.3132" fill="#ED9B88"/>
<path d="M240.993 44.0309C240.993 44.0309 244.795 44.341 247.342 42.542C247.342 42.542 248.032 44.7259 248.357 45.435C248.683 46.1441 241.644 46.5989 241.181 44.74L240.993 44.0309Z" fill="#D18478"/>
<path d="M232.539 26.5596C232.539 26.5596 234.185 31.0464 236.747 30.4738C236.747 30.4738 236.86 30.6589 237.487 29.5407C238.114 28.4225 240.16 28.7905 241.082 28.8834C242.004 28.9762 246.383 29.3436 247.359 29.1767C248.335 29.0099 249.324 30.5748 249.324 30.5748C249.324 30.5748 249.895 30.7187 249.51 29.3725C249.082 27.8742 242.594 24.9994 237.215 27.8506" fill="#68221E"/>
<path d="M249.643 29.221C249.643 29.221 245.24 26.0771 240.381 27.6218C235.522 29.1665 232.921 26.688 232.54 26.5574C232.54 26.5574 237.079 26.4363 238.655 25.7037C240.733 24.7369 241.948 24.3386 246.158 24.0964C250.471 23.8495 255.662 27.0768 249.643 29.221Z" fill="#994642"/>
<path d="M247.102 24.7332C250.454 25.4497 246.537 26.2766 245.315 26.504C246.936 26.7394 249.41 27.02 249.771 25.8177C250.157 24.524 247.102 24.7332 247.102 24.7332Z" fill="#BC6D6D"/>
<path d="M241.221 47.8865L244.466 50.5642L248.046 47.2676L257.68 88.6675C257.68 88.6675 249.633 92.9881 238.816 89.8455C238.816 89.8455 238.116 57.8317 237.711 58.0281" fill="white"/>
<path d="M244.466 50.5645L242.415 53.6694L240.362 49.9233L241.687 47.2188L244.466 50.5645Z" fill="#E5E5E5"/>
<path d="M244.466 50.5654L246.746 53.239L249.923 49.4977L248.773 45.6816L244.466 50.5654Z" fill="#E5E5E5"/>
<path d="M248.408 45.285C248.408 45.285 252.147 85.8614 257.68 96.8157C257.68 96.8157 268.748 92.3208 270.006 92.1452C271.264 91.9696 260.229 61.2334 259.206 59.9611C258.184 58.6889 259.256 46.3271 259.256 46.3271C259.256 46.3271 255.129 44.2428 248.408 45.285Z" fill="#F6473E"/>
<path d="M241.687 47.2188C241.687 47.2188 241.437 60.2997 241.208 73.3901C241.012 84.6156 240.832 95.2886 240.839 96.2036C240.854 98.1877 237.711 95.4669 237.711 95.4669C237.711 95.4669 239.049 69.3837 237.027 66.262C237.027 66.262 230.293 75.7052 220.866 79.2319C211.438 82.7587 206.913 81.8767 206.913 81.8767L204.65 72.1764C204.65 72.1764 221.883 67.179 223.168 66.262C224.452 65.345 237.137 50.4219 237.137 50.4219" fill="#F6473E"/>
<path d="M248.408 45.3144L251.974 44.9941L255.794 55.9935L253.157 60.6236L256.926 62.3937L251.662 74.2798L248.408 45.3144Z" fill="#D82723"/>
<path d="M239.613 48.6303L241.618 47.2188L241.28 75.2928L237.283 62.9418L239.613 61.9911L237.283 58.1623L239.613 48.6303Z" fill="#D82723"/>
<path d="M251.254 80.6533C248.832 81.5205 245.539 82.157 242.957 82.4698C242.781 84.5084 243.033 87.7034 243.582 89.6687C245.059 89.6747 246.493 89.7501 247.995 89.6411C249.34 89.5442 249.286 89.5294 250.112 88.6992C251.436 87.363 251.994 85.8008 254.098 85.4779" fill="#ED9B88"/>
<path d="M242.902 106.373C242.902 106.373 258.845 125.463 269.514 106.373C269.514 106.373 260.864 110.292 242.902 106.373Z" fill="#0C1027"/>
<path d="M173.055 106.412C173.077 106.87 172.992 108.296 173.261 108.659C173.76 109.332 175 108.804 175.626 108.381C176.527 107.771 177.169 106.78 177.838 105.967C178.681 104.944 179.04 104.66 178.833 103.344C178.625 102.027 178.215 100.693 177.862 99.4111C177.391 97.705 176.401 98.1779 174.991 98.9402C173.9 99.5316 172.291 100.261 172.338 101.551C172.399 103.128 172.973 104.795 173.055 106.412Z" fill="#F9BAAF"/>
<path d="M133.965 114.278C133.965 114.278 142.901 121.583 155.081 110.065L133.965 114.278Z" fill="#072051"/>
<path d="M165.458 35.218C166.734 37.2081 167.78 37.8816 167.038 40.3743C166.184 43.2437 165.391 46.2275 165.495 49.2254C165.522 50.02 165.604 50.7628 165.191 51.4873C164.676 52.3963 163.718 53.0253 163.066 53.8421C161.484 55.8322 161.333 58.9721 162.79 61.082C163.379 61.9371 164.441 62.4672 165.431 62.8433C166.701 63.3257 169.065 63.8902 170.204 62.9106C171.258 62.0023 170.618 61.1728 170.28 60.1232C169.334 57.2195 171.85 57.4166 172.902 55.2745C173.634 53.7883 171.547 51.5815 171.848 49.8108C172.303 47.1398 174.05 44.5193 173.791 41.7696C173.447 38.0754 170.71 32.4435 165.668 33.1728C162.488 33.6323 163.878 36.1936 166.361 36.5865" fill="#823D3A"/>
<path d="M166.03 36.2131C172.892 35.6514 172.878 55.3411 162.908 53.4432C158.459 52.5955 154.47 50.3013 152.875 46.2195C152.061 44.1339 151.716 41.652 153.358 39.8361C155.166 37.8359 158.321 36.0355 160.957 35.0513C162.869 34.3374 165.69 35.0512 167.265 36.156" fill="#F9BAAF"/>
<path d="M158.271 53.5892C158.205 53.6661 158.149 53.7496 158.106 53.8382C157.866 54.3266 157.888 54.9765 157.734 55.504C157.296 57.0191 156.732 57.5122 155.153 57.8816C154.242 58.0956 153.312 58.0162 152.387 58.0895C151.369 58.1696 150.49 58.4844 149.579 58.8854C148.422 59.3927 147.143 59.9323 145.891 59.3779C143.664 58.3916 141.7 54.9859 142.085 52.724C142.388 50.9553 144.488 51.6126 145.031 50.2784C145.833 48.3052 141.153 44.7333 144.756 43.5169C146.015 43.0917 148.314 43.6973 148.794 41.9958C149.198 40.5621 148.062 39.2326 149.152 37.8568C150.527 36.1197 152.66 35.0721 154.751 34.2238C157.037 33.2973 159.351 32.3998 161.861 32.1731C163.303 32.0426 165.108 32.015 166.326 32.8708C167.355 33.594 168.386 36.041 168.057 37.1658C167.843 37.8972 166.742 38.5464 166.109 38.9884C164.465 40.1322 162.738 41.2833 160.911 42.1815C159.142 43.0507 157.676 43.7497 157.098 45.688C156.864 44.7811 158.225 39.9431 155.071 40.9785C153.781 41.4044 153.471 44.1689 153.727 45.1821C154.212 47.1036 155.305 49.1932 156.763 50.6613C157.334 51.2378 158.553 51.8534 158.688 52.6924C158.762 53.164 158.497 53.3194 158.271 53.5892Z" fill="#823D3A"/>
<path d="M161.187 44.1471L160.902 44.0529C161.147 43.4689 162.282 42.7396 163.15 42.6091C163.587 42.5418 163.93 42.6286 164.145 42.8567L163.911 43.0289C163.768 42.8769 163.532 42.8271 163.201 42.8742C162.387 42.9966 161.377 43.695 161.187 44.1471Z" fill="black"/>
<path d="M170.39 44.3588C170.195 43.7298 169.403 43.0651 168.278 43.0133L168.294 42.7441C169.257 42.7899 170.387 43.3348 170.683 44.2915L170.39 44.3588Z" fill="black"/>
<path d="M166.239 48.1042L166.156 47.9165C166.503 47.7961 166.708 47.6568 166.781 47.4893C166.862 47.3009 166.798 47.0459 166.566 46.6355C166.174 45.9405 166.087 45.2846 166.314 44.7383L166.528 44.8056C166.323 45.2987 166.406 45.8995 166.769 46.5434C166.965 46.8885 167.127 47.2505 166.997 47.5599C166.894 47.7894 166.655 47.9609 166.239 48.1042Z" fill="#842E26"/>
<path d="M166.349 49.337C166.534 49.296 167.474 49.0766 167.515 48.9414C167.219 49.9277 167.01 51.1737 165.558 50.916C164.788 50.7815 164.365 49.9028 164.252 49.2462C164.928 49.4464 165.653 49.4778 166.349 49.337Z" fill="#842E26"/>
<path d="M155.94 42.5146C155.898 42.7165 156.065 43.2991 155.98 43.6395C155.667 43.5938 155.407 43.3287 155.217 43.7115C155.026 44.0943 155.384 44.1993 155.666 44.348C156.311 44.6844 155.919 45.4386 155.21 45.2226C153.47 44.7012 155.17 41.8768 155.994 42.7064" fill="#D18478"/>
<path d="M163.235 44.9088C163.247 45.1846 163.099 45.414 162.903 45.4214C162.706 45.4288 162.539 45.2108 162.523 44.9357C162.507 44.6605 162.66 44.4297 162.856 44.423C163.052 44.4163 163.224 44.6329 163.235 44.9088Z" fill="black"/>
<path d="M162.893 45.622C162.767 45.6208 162.647 45.5769 162.557 45.4995C162.394 45.3501 162.301 45.1506 162.299 44.9425C162.282 44.5489 162.527 44.232 162.85 44.2199C162.916 44.2183 162.981 44.2283 163.042 44.2495C163.104 44.2706 163.159 44.3024 163.206 44.343C163.37 44.4925 163.462 44.692 163.463 44.9001C163.48 45.293 163.235 45.6099 162.912 45.622H162.893ZM162.869 44.6236C162.837 44.6283 162.746 44.7406 162.755 44.9263C162.763 45.112 162.864 45.215 162.894 45.2183C162.923 45.2217 163.017 45.1147 163.007 44.9156C162.999 44.7184 162.894 44.6276 162.869 44.6236Z" fill="black"/>
<path d="M169.342 44.8245C169.354 45.1003 169.205 45.3298 169.01 45.3365C168.814 45.3432 168.646 45.1259 168.634 44.8507C168.622 44.5756 168.77 44.3455 168.966 44.3381C169.162 44.3307 169.33 44.5487 169.342 44.8245Z" fill="black"/>
<path d="M168.999 45.5387C168.873 45.5371 168.754 45.4931 168.664 45.4156C168.5 45.2663 168.408 45.0668 168.406 44.8585C168.389 44.4656 168.634 44.1487 168.956 44.1359C169.022 44.1342 169.087 44.1442 169.148 44.1653C169.21 44.1865 169.265 44.2184 169.312 44.2591C169.476 44.4084 169.568 44.608 169.57 44.8161C169.587 45.209 169.342 45.5259 169.019 45.538L168.999 45.5387ZM168.975 44.5396C168.952 44.5396 168.852 44.6439 168.861 44.8424C168.869 45.0408 168.971 45.1317 169 45.135C169.03 45.1384 169.123 45.0307 169.115 44.8323C169.107 44.6479 169.008 44.5423 168.975 44.5396Z" fill="black"/>
<path d="M164.941 50.604C164.941 50.604 165.771 50.0146 167.132 50.1027C167.132 50.1027 166.467 51.6555 164.941 50.604Z" fill="#B7331D"/>
<path d="M164.074 37.3266C164.074 37.3266 157.508 38.7805 157.722 34.4033C157.722 34.4033 152.581 40.4106 164.582 37.5398" fill="#B76C6C"/>
<path d="M170.409 38.0792C170.409 38.0792 172.172 38.6619 171.761 37.8936C171.761 37.8936 173.88 41.3988 170.144 38.0046" fill="#B76C6C"/>
<path d="M158.056 50.5371C157.547 52.0233 156.951 54.5483 155.708 55.6503C154.454 56.7597 152.335 56.4731 150.784 56.9205C151.624 59.208 157.587 61.7572 160.108 61.9799C161.786 62.1272 162.647 61.9563 162.514 60.6094C162.379 59.2423 161.801 58.0037 162.058 56.6352C162.334 55.1706 163.393 53.8351 163.751 52.3772C162.237 51.8618 159.466 50.599 157.906 50.9832" fill="#F9BAAF"/>
<path d="M159.328 52.4982C159.328 52.4982 161.652 53.315 163.347 53.5148C163.347 53.5148 162.774 54.6384 162.537 55.2136C162.537 55.2136 160.542 54.1257 159.116 54.7682C159.116 54.7682 157.502 55.4114 156.029 55.3179C156.029 55.3179 156.751 54.6626 157.085 53.4233C157.419 52.184 157.738 51.5254 157.738 51.5254L159.328 52.4982Z" fill="#D18478"/>
<path d="M164.251 59.9033C164.251 59.9033 166.597 61.5086 167.516 65.3939C168.435 69.2793 171.066 84.1189 173.817 87.3268C176.568 90.5346 182.011 96.7875 182.011 96.7875L172.478 101.632C172.478 101.632 161.757 81.0443 161.515 77.8633C161.274 74.6824 161.206 66.2376 161.515 65.9846C161.825 65.7317 164.251 59.9033 164.251 59.9033Z" fill="#407CA0"/>
<path d="M129.769 101.882C131.508 104.339 130.559 109.587 131.465 110.374C136.612 114.835 144.252 110.259 148.838 109.459C154.294 108.505 158.6 103.409 159.557 100.029C158.211 91.7279 154.004 85.9238 154.004 85.9238L135.379 80.7676C135.008 80.8685 130.223 89.76 129.112 95.468C128.887 96.6204 128.954 99.4354 129.769 101.882Z" fill="#072051"/>
<path d="M164.252 59.9036L162.037 57.9855C162.037 57.9855 162.341 61.5694 159.163 60.3261C155.986 59.0828 155.709 55.6462 155.709 55.6462H150.785C150.771 55.6362 150.754 55.6286 150.736 55.624C150.205 56.3484 149.523 56.9769 148.727 57.4762C147.681 58.1355 146.623 58.776 145.366 59.0734C145.082 59.1407 144.796 59.1905 144.508 59.2315C144.384 59.3136 144.256 59.391 144.129 59.465C140.879 63.6712 138.1 73.9722 136.981 78.451C137.256 78.7201 137.388 79.1123 137.228 79.5846C136.988 80.2924 136.736 80.9975 136.483 81.7005C136.591 82.0233 136.562 82.37 136.4 82.6747C136.049 83.324 135.705 83.9692 135.437 84.6527C135.329 84.9533 135.097 85.2068 134.788 85.3632C140.047 89.562 154.21 90.2577 154.21 89.8036C154.21 89.2963 153.567 82.0322 158.592 79.6667C163.617 77.3012 164.122 74.4291 163.755 72.3179C163.388 70.2067 164.252 59.9036 164.252 59.9036Z" fill="white"/>
<path d="M155.708 55.4493C155.708 55.4493 155.75 64.0011 154.452 73.476C152.982 84.1908 150.182 96.021 150.784 96.79L129.839 89.7258C129.152 85.2915 136.659 78.3268 137.214 77.2207C137.214 77.2207 140.961 64.9343 142.02 62.8904C143.079 60.8464 143.97 58.8368 145.579 57.8445C147.189 56.8521 150.241 55.4453 150.241 55.4453L155.708 55.4493Z" fill="#407CA0"/>
<path d="M164.252 59.9035L162.037 57.9854C162.037 57.9854 160.999 67.2523 161.601 68.0973C162.056 68.7358 162.684 71.69 162.608 74.0064L163.799 74.4363L164.252 59.9035Z" fill="#407CA0"/>
<path d="M162.605 74.0068C162.58 74.7556 162.482 75.4378 162.28 75.9539C161.455 78.0651 158.517 78.3187 156.774 80.366C155.217 82.194 155.438 82.3756 155.051 83.6344C154.548 85.2706 154.739 84.542 154.236 87.3293C153.732 90.1167 155.223 91.4845 155.223 91.4845C158.867 93.0924 163.139 95.4667 163.139 95.4667L163.794 74.4367L162.605 74.0068Z" fill="#072051"/>
<path d="M147.36 71.1169C147.36 71.1169 145.328 64.4657 144.778 61.9852C144.229 59.5046 145.677 58.4598 147.734 57.5798C149.791 56.6998 153.552 62.6102 156.73 64.9993C159.908 67.3883 163.347 69.6523 166.994 71.4129C170.642 73.1736 185.732 75.4369 185.732 75.4369C185.732 75.4369 184.771 84.1158 183.674 84.7428C183.674 84.7428 163.209 80.3987 160.693 78.3864C158.177 76.3741 147.36 71.1169 147.36 71.1169Z" fill="#407CA0"/>
<path d="M144.033 67.986C144.033 67.986 145.488 71.1165 148.403 72.82C151.201 74.4549 147.325 75.2925 147.325 75.2925L145.306 76.1193L143.762 83.6983L144.217 88.0559L144.944 90.9906L141.898 87.3286L137.851 84.7364L134.787 85.3627L139.009 82.0163L141.568 78.0852L143.195 70.9032L142.171 67.1659L143.193 65.8203L144.033 67.986Z" fill="#39768E"/>
</svg>

            </div>
        )
    }

    // prototype for displaying document + signing it
    renderDocument = () => {
        //display document if present
             let documentSection = (
                <div>
                    <div className="uploaded-files-container">
                    <div className="uploaded-file-name-readonly-link">
                      <a target="_blank" href={this.state.file}>{"file to sign"}</a>
                     
                    </div>

                </div>
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
            willSubmit: true
        })
    }

    handleSkip(e: React.MouseEvent<HTMLButtonElement>){
        this.props.sendMessage('Skip Signature');
    }

    //initial starting screen, should be popup, for now is treated as node
    renderStartingScreen() {
        return (
            <div className="esign__card gideon__node">
               <div id="document_area">
               { this.renderSigningIcon()}
               <div className="esign-message-handoff">
                    Place holder {this.state.handoff_message}
                </div>
    
               </div> 
                <div>
                  <button type="button" className="gideon-submit-button" id="sign_btn" onClick={e => this.handleSign(e)}>
                         Review & Sign
                  </button>
                </div>
                <div>
                    <button type="button" className="gideon-submit-button-white" onClick={e => this.handleSkip(e)}>
                         Sign Later
                    </button>
                </div>
            </div>
        );

    }

    //For when the sign button leads to small modal to sign
    renderSignatureModal() {

    }



    //screen 1: message + button to sign
    //screen 2: document viewable + signature box

    render() {
        const {willSubmit} = this.state;
       //need to add if case for when to show renderSigningIcon vs renderDocument
        
       //for now focus on clicking link of document + downloading it

       return (
        <div className="esign__card gideon__node">
            <NodeHeader
            header="Esign Document"
            />
            {willSubmit == false && this.renderStartingScreen()}
            {willSubmit == true && this.renderDocument()}

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
        return {
            // from stateProps
            node: ownProps.node,
            // from dispatchProps
            sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
            gid: ownProps.gid,
            directLine: ownProps.directLine,
            conversationId: stateProps.conversationId,
            document: ownProps.activity.pdf_link[0]
           
        }
    }
)(Esign);