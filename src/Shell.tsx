import { any } from 'bluebird';
import { DirectLineOptions, IBotConnection, User } from 'botframework-directlinejs';
import * as color from 'color';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { conversationHistory, mapMessagesToActivities, step } from './api/bot';
import { classList } from './Chat';
import { Speech } from './SpeechModule';
import { ChatState, createStore, FormatState} from './Store';
import { ChatActions, ListeningState, sendFiles, sendMessage } from './Store';
import { defaultStrings, Strings } from './Strings';

interface Props {
    inputText: string;
    placeholder: string;
    strings: Strings;
    listeningState: ListeningState;
    showUploadButton: boolean;
    inputEnabled: boolean;
    fullscreen: boolean;
    themeColor: string;
    gid: string;
    botConnection?: IBotConnection;
    directLine?: DirectLineOptions;
    onChangeText: (inputText: string) => void;
    sendMessage: (inputText: string) => void;
    sendFiles: (files: FileList) => void;
    stopListening: () => void;
    startListening: () => void;
}

export interface ShellFunctions {
    focus: (appendKey?: string) => void;
}

class ShellContainer extends React.Component<Props> implements ShellFunctions {
    private textInput: HTMLInputElement;
    private fileInput: HTMLInputElement;
    private store = createStore();
    private clicked: any;

    constructor(props:any) {
        super(props);
        this.clicked = {disabled: false};
    }

    
    private sendMessage() {
        if (this.props.inputText.trim().length > 0) {
            this.props.sendMessage(this.props.inputText);
        }
    }

    private handleSendButtonKeyPress(evt: React.KeyboardEvent<HTMLButtonElement>) {
        if (evt.key === 'Enter' || evt.key === ' ') {
            evt.preventDefault();
            this.sendMessage();
            this.textInput.focus();
        }
    }

    private handleUploadButtonKeyPress(evt: React.KeyboardEvent<HTMLLabelElement>) {
        if (evt.key === 'Enter' || evt.key === ' ') {
            evt.preventDefault();
            this.fileInput.click();
        }
    }

    private onKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            this.sendMessage();
        }
    }

    private onClickSend() {
        this.sendMessage();
    }

    private onChangeFile() {
        // IE11 quirks: IE11 fire `onChange` event if we programmatically set `this.fileInput.value = null`, it should not
        if (this.fileInput.files.length) {
            this.props.sendFiles(this.fileInput.files);
            this.fileInput.value = null;
        }

        this.textInput.focus();
    }

    private onTextInputFocus() {
        if (this.props.listeningState === ListeningState.STARTED) {
            this.props.stopListening();
        }
    }

    private onClickMic() {
        if (this.props.listeningState === ListeningState.STARTED) {
            this.props.stopListening();
        } else if (this.props.listeningState === ListeningState.STOPPED) {
            this.props.startListening();
        }
    }

    private step = (messageId?: string|null) => {
        console.log("here")
        const botConnection: any = this.props.botConnection;
        console.log(botConnection);
        console.log(this.store.getState());
        console.log(this.props);
        step(this.props.gid,botConnection.conversationId, botConnection.secret, messageId)
        .then((res: any) => {
            conversationHistory(this.props.gid, botConnection.secret, botConnection.conversationId, res.data.id)
            .then((res: any) => {
                const messages = res.data.messages.reverse();
                this.store.dispatch<ChatActions>({
                    type: 'Set_Messages',
                    activities: mapMessagesToActivities(messages, this.store.getState().connection.user.id)
                });

                // reset shell input
                this.store.dispatch<ChatActions>(
                    { type: 'Submit_Date' } as ChatActions
                );
            });
        })
        .catch((err: any) => {
            console.log(err);
        });
    }

    public focus(appendKey?: string) {
        this.textInput.focus();

        if (appendKey) {
            this.props.onChangeText(this.props.inputText + appendKey);
        }
    }
    
    render() {
        // Override
        const showUploadButton = false;

        let wcBorderStyles;
        if (this.props.themeColor) {
            wcBorderStyles = {
                backgroundImage: `linear-gradient(90deg, ${this.props.themeColor}, ${color(this.props.themeColor).lighten(0.5)})`
            };
        }
        const className = classList(
            'wc-console',
            !this.props.inputEnabled && 'wc-console__disabled',
            this.props.inputText.length > 0 && 'has-text',
            showUploadButton && 'has-upload-button',
            this.props.fullscreen && 'wc-console-fullscreen'
        );

        const showMicButton = this.props.listeningState !== ListeningState.STOPPED || (Speech.SpeechRecognizer.speechIsAvailable()  && !this.props.inputText.length);

        const sendButtonClassName = classList(
            'wc-send',
            showMicButton && 'hidden'
        );

        const micButtonClassName = classList(
            'wc-mic',
            !showMicButton && 'hidden',
            this.props.listeningState === ListeningState.STARTED && 'active',
            this.props.listeningState !== ListeningState.STARTED && 'inactive'
        );

        const placeholder = this.props.listeningState === ListeningState.STARTED ? this.props.strings.listeningIndicator : this.props.placeholder;

        return (
            <div className={ className } >
                <div className="wc-border" style={wcBorderStyles} />

                { <div> 
                { <label
                    className="wc-backbutton" onClick={() => {
                        if (!this.clicked.disabled) {
                        this.step(); this.clicked.disabled = true; }// disable click action after first click
                    }}>
                    <svg width="94" height="56" viewBox="0 0 94 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="92" height="54" rx="1" fill="#F8F8F8" stroke="#F8F8F8" stroke-width="2"/>
                        <path d="M49.488 33.768C49.9307 33.768 50.312 33.7173 50.632 33.616C50.952 33.5147 51.2133 33.3733 51.416 33.192C51.624 33.0053 51.776 32.7867 51.872 32.536C51.968 32.28 52.016 32 52.016 31.696C52.016 31.104 51.8053 30.6373 51.384 30.296C50.9627 29.9493 50.3307 29.776 49.488 29.776H47.008V33.768H49.488ZM47.008 24.76V28.672H49.056C49.4933 28.672 49.872 28.624 50.192 28.528C50.5173 28.432 50.784 28.2987 50.992 28.128C51.2053 27.9573 51.3627 27.752 51.464 27.512C51.5653 27.2667 51.616 27 51.616 26.712C51.616 26.0347 51.4133 25.5413 51.008 25.232C50.6027 24.9173 49.9733 24.76 49.12 24.76H47.008ZM49.12 23.536C49.824 23.536 50.4293 23.6053 50.936 23.744C51.448 23.8827 51.8667 24.08 52.192 24.336C52.5227 24.592 52.7653 24.9067 52.92 25.28C53.0747 25.648 53.152 26.064 53.152 26.528C53.152 26.8107 53.1067 27.0827 53.016 27.344C52.9307 27.6 52.8 27.84 52.624 28.064C52.448 28.288 52.224 28.4907 51.952 28.672C51.6853 28.848 51.3707 28.992 51.008 29.104C51.8507 29.264 52.4827 29.5653 52.904 30.008C53.3307 30.4453 53.544 31.0213 53.544 31.736C53.544 32.2213 53.4533 32.664 53.272 33.064C53.096 33.464 52.8347 33.808 52.488 34.096C52.1467 34.384 51.7253 34.608 51.224 34.768C50.7227 34.9227 50.152 35 49.512 35H45.464V23.536H49.12ZM59.7388 31.352C59.0828 31.3733 58.5228 31.4267 58.0588 31.512C57.6001 31.592 57.2241 31.6987 56.9308 31.832C56.6428 31.9653 56.4321 32.1227 56.2988 32.304C56.1708 32.4853 56.1068 32.688 56.1068 32.912C56.1068 33.1253 56.1414 33.3093 56.2108 33.464C56.2801 33.6187 56.3734 33.7467 56.4908 33.848C56.6134 33.944 56.7548 34.016 56.9148 34.064C57.0801 34.1067 57.2561 34.128 57.4428 34.128C57.6934 34.128 57.9228 34.104 58.1308 34.056C58.3388 34.0027 58.5334 33.928 58.7148 33.832C58.9014 33.736 59.0774 33.6213 59.2428 33.488C59.4134 33.3547 59.5788 33.2027 59.7388 33.032V31.352ZM55.1388 28.04C55.5868 27.608 56.0694 27.2853 56.5868 27.072C57.1041 26.8587 57.6774 26.752 58.3068 26.752C58.7601 26.752 59.1628 26.8267 59.5148 26.976C59.8668 27.1253 60.1628 27.3333 60.4028 27.6C60.6428 27.8667 60.8241 28.1893 60.9468 28.568C61.0694 28.9467 61.1308 29.3627 61.1308 29.816V35H60.4988C60.3601 35 60.2534 34.9787 60.1788 34.936C60.1041 34.888 60.0454 34.7973 60.0028 34.664L59.8428 33.896C59.6294 34.0933 59.4214 34.2693 59.2188 34.424C59.0161 34.5733 58.8028 34.7013 58.5788 34.808C58.3548 34.9093 58.1148 34.9867 57.8588 35.04C57.6081 35.0987 57.3281 35.128 57.0188 35.128C56.7041 35.128 56.4081 35.0853 56.1308 35C55.8534 34.9093 55.6108 34.776 55.4028 34.6C55.2001 34.424 55.0374 34.2027 54.9148 33.936C54.7974 33.664 54.7388 33.344 54.7388 32.976C54.7388 32.656 54.8268 32.3493 55.0028 32.056C55.1788 31.7573 55.4641 31.4933 55.8588 31.264C56.2534 31.0347 56.7681 30.848 57.4028 30.704C58.0374 30.5547 58.8161 30.4693 59.7388 30.448V29.816C59.7388 29.1867 59.6028 28.712 59.3308 28.392C59.0588 28.0667 58.6614 27.904 58.1388 27.904C57.7868 27.904 57.4908 27.9493 57.2508 28.04C57.0161 28.1253 56.8108 28.224 56.6348 28.336C56.4641 28.4427 56.3148 28.5413 56.1868 28.632C56.0641 28.7173 55.9414 28.76 55.8188 28.76C55.7228 28.76 55.6401 28.736 55.5708 28.688C55.5014 28.6347 55.4428 28.5707 55.3947 28.496L55.1388 28.04ZM68.9399 28.336C68.8972 28.3947 68.8545 28.44 68.8119 28.472C68.7692 28.504 68.7105 28.52 68.6359 28.52C68.5559 28.52 68.4679 28.488 68.3719 28.424C68.2759 28.3547 68.1559 28.28 68.0119 28.2C67.8732 28.12 67.6999 28.048 67.4919 27.984C67.2892 27.9147 67.0385 27.88 66.7399 27.88C66.3399 27.88 65.9879 27.952 65.6839 28.096C65.3799 28.2347 65.1239 28.4373 64.9159 28.704C64.7132 28.9707 64.5585 29.2933 64.4519 29.672C64.3505 30.0507 64.2999 30.4747 64.2999 30.944C64.2999 31.4347 64.3559 31.872 64.4679 32.256C64.5799 32.6347 64.7372 32.9547 64.9399 33.216C65.1479 33.472 65.3959 33.6693 65.6839 33.808C65.9772 33.9413 66.3052 34.008 66.6679 34.008C67.0145 34.008 67.2999 33.968 67.5239 33.888C67.7479 33.8027 67.9319 33.7093 68.0759 33.608C68.2252 33.5067 68.3479 33.416 68.4439 33.336C68.5452 33.2507 68.6439 33.208 68.7399 33.208C68.8572 33.208 68.9479 33.2533 69.0119 33.344L69.4119 33.864C69.2359 34.0827 69.0359 34.2693 68.8119 34.424C68.5879 34.5787 68.3452 34.7093 68.0839 34.816C67.8279 34.9173 67.5585 34.992 67.2759 35.04C66.9932 35.088 66.7052 35.112 66.4119 35.112C65.9052 35.112 65.4332 35.0187 64.9959 34.832C64.5639 34.6453 64.1879 34.376 63.8679 34.024C63.5479 33.6667 63.2972 33.2293 63.1159 32.712C62.9345 32.1947 62.8439 31.6053 62.8439 30.944C62.8439 30.3413 62.9265 29.784 63.0919 29.272C63.2625 28.76 63.5079 28.32 63.8279 27.952C64.1532 27.5787 64.5505 27.288 65.0199 27.08C65.4945 26.872 66.0385 26.768 66.6519 26.768C67.2225 26.768 67.7239 26.8613 68.1559 27.048C68.5932 27.2293 68.9799 27.488 69.3159 27.824L68.9399 28.336ZM72.3725 23.216V30.152H72.7405C72.8472 30.152 72.9352 30.1387 73.0045 30.112C73.0792 30.08 73.1565 30.0187 73.2365 29.928L75.7965 27.184C75.8712 27.0933 75.9485 27.024 76.0285 26.976C76.1138 26.9227 76.2258 26.896 76.3645 26.896H77.6525L74.6685 30.072C74.5245 30.2533 74.3698 30.3947 74.2045 30.496C74.3005 30.56 74.3858 30.6347 74.4605 30.72C74.5405 30.8 74.6152 30.8933 74.6845 31L77.8525 35H76.5805C76.4578 35 76.3512 34.9813 76.2605 34.944C76.1752 34.9013 76.1005 34.8267 76.0365 34.72L73.3725 31.4C73.2925 31.288 73.2125 31.216 73.1325 31.184C73.0578 31.1467 72.9405 31.128 72.7805 31.128H72.3725V35H70.9405V23.216H72.3725Z" fill="#3F6DE1"/>
                        <path d="M32.75 27.858H17.925L22.4625 22.8755C22.6747 22.6422 22.7768 22.3413 22.7463 22.0391C22.7158 21.737 22.5553 21.4582 22.3 21.2643C22.0447 21.0703 21.7156 20.977 21.3851 21.0048C21.0546 21.0327 20.7497 21.1795 20.5375 21.4128L14.2875 28.2694C14.2455 28.3239 14.2078 28.3812 14.175 28.4408C14.175 28.4979 14.175 28.5322 14.0875 28.5893C14.0308 28.7203 14.0012 28.8598 14 29.0007C14.0012 29.1416 14.0308 29.2811 14.0875 29.4121C14.0875 29.4692 14.0875 29.5035 14.175 29.5607C14.2078 29.6202 14.2455 29.6775 14.2875 29.7321L20.5375 36.5886C20.655 36.7176 20.8022 36.8213 20.9686 36.8924C21.1349 36.9635 21.3164 37.0003 21.5 37C21.7921 37.0005 22.0751 36.9075 22.3 36.7372C22.4266 36.6412 22.5312 36.5234 22.6079 36.3905C22.6846 36.2575 22.7318 36.112 22.7469 35.9623C22.762 35.8127 22.7447 35.6617 22.6959 35.5182C22.6471 35.3747 22.5678 35.2414 22.4625 35.1259L17.925 30.1435H32.75C33.0815 30.1435 33.3995 30.0231 33.6339 29.8088C33.8683 29.5945 34 29.3038 34 29.0007C34 28.6976 33.8683 28.407 33.6339 28.1927C33.3995 27.9784 33.0815 27.858 32.75 27.858Z" fill="#3F6DE1"/>
                    </svg>
                </label>}   
               </div> }
                
                {
                    showUploadButton &&
                        <label
                            className="wc-upload"
                            htmlFor="wc-upload-input"
                            onKeyPress={ evt => this.handleUploadButtonKeyPress(evt) }
                            tabIndex={ 0 }
                        >
                            <svg>
                                <path d="M19.96 4.79m-2 0a2 2 0 0 1 4 0 2 2 0 0 1-4 0zM8.32 4.19L2.5 15.53 22.45 15.53 17.46 8.56 14.42 11.18 8.32 4.19ZM1.04 1L1.04 17 24.96 17 24.96 1 1.04 1ZM1.03 0L24.96 0C25.54 0 26 0.45 26 0.99L26 17.01C26 17.55 25.53 18 24.96 18L1.03 18C0.46 18 0 17.55 0 17.01L0 0.99C0 0.45 0.47 0 1.03 0Z" />
                            </svg>
                        </label>
                }
                {
                     showUploadButton &&
                     <input
                         id="wc-upload-input"
                         tabIndex={ -1 }
                         type="file"
                         ref={ input => this.fileInput = input }
                         multiple
                         onChange={ () => this.onChangeFile() }
                         aria-label={ this.props.strings.uploadFile }
                         role="button"
                     />
                }

                <div className="wc-textbox">
                    <input
                        type="text"
                        className="wc-shellinput"
                        ref={ input => this.textInput = input }
                        autoFocus
                        value={ this.props.inputText }
                        onChange={ _ => this.props.onChangeText(this.textInput.value) }
                        onKeyPress={ e => this.onKeyPress(e) }
                        onFocus={ () => this.onTextInputFocus() }
                        placeholder={ placeholder }
                        aria-label={ this.props.inputText ? null : placeholder }
                        aria-live="polite"
                        disabled={ !this.props.inputEnabled }
                    />
                </div>

                <button
                    className={ sendButtonClassName }
                    onClick={ () => this.onClickSend() }
                    aria-label={ this.props.strings.send }
                    role="button"
                    onKeyPress={ evt => this.handleSendButtonKeyPress(evt) }
                    tabIndex={ 0 }
                    type="button"
                >

                    {/* Send message arrow vector */}
                    <svg id="Layer_1" data-name="Layer 1" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
                        <title>wc-send</title>
                        <path className="sendFilling" d="M53 0H3C1.34315 0 0 1.34315 0 3V53C0 54.6569 1.34315 56 3 56H53C54.6569 56 56 54.6569 56 53V3C56 1.34315 54.6569 0 53 0Z"/>
                        <path className="sendArrow" d="M20.5974 35.5859C20.4419 35.5847 20.2879 35.5475 20.1492 35.4772C20.0104 35.407 19.8897 35.3056 19.7966 35.181C19.7037 35.0566 19.6421 34.9123 19.615 34.7595C19.5879 34.6066 19.5968 34.4496 19.6413 34.301L21.3835 28.2629C21.4465 28.2815 21.5122 28.2909 21.5779 28.291H26.3708C26.5565 28.291 26.7347 28.2172 26.866 28.0859C26.9972 27.9547 27.071 27.7766 27.071 27.5909C27.071 27.4053 26.9972 27.2273 26.866 27.096C26.7347 26.9647 26.5565 26.891 26.3708 26.891H21.5779C21.5122 26.8912 21.4466 26.9006 21.3835 26.9189L19.6413 20.881C19.597 20.7332 19.5871 20.577 19.614 20.425C19.6409 20.2731 19.7032 20.1296 19.7956 20.006C19.8883 19.8809 20.0093 19.7791 20.1482 19.7088C20.2871 19.6385 20.4408 19.6015 20.5964 19.601C20.7447 19.6021 20.8907 19.6363 21.0242 19.701L36.1238 26.692C36.2969 26.7732 36.4437 26.9024 36.5456 27.0643C36.6476 27.2261 36.7005 27.4137 36.699 27.605C36.7001 27.7945 36.6467 27.9802 36.5447 28.1399C36.4427 28.2996 36.2962 28.4263 36.1238 28.5049L21.0242 35.496C20.8902 35.557 20.7446 35.5877 20.5974 35.5859Z"/>
                    </svg>

                </button >

                <button
                    className={ micButtonClassName }
                    onClick={ () => this.onClickMic() }
                    aria-label={ this.props.strings.speak }
                    role="button"
                    tabIndex={ 0 }
                    type="button"
                >
                   <svg width="28" height="22" viewBox="0 0 58 58" >
                        <path d="M 44 28 C 43.448 28 43 28.447 43 29 L 43 35 C 43 42.72 36.72 49 29 49 C 21.28 49 15 42.72 15 35 L 15 29 C 15 28.447 14.552 28 14 28 C 13.448 28 13 28.447 13 29 L 13 35 C 13 43.485 19.644 50.429 28 50.949 L 28 56 L 23 56 C 22.448 56 22 56.447 22 57 C 22 57.553 22.448 58 23 58 L 35 58 C 35.552 58 36 57.553 36 57 C 36 56.447 35.552 56 35 56 L 30 56 L 30 50.949 C 38.356 50.429 45 43.484 45 35 L 45 29 C 45 28.447 44.552 28 44 28 Z"/>
                        <path id="micFilling" d="M 28.97 44.438 L 28.97 44.438 C 23.773 44.438 19.521 40.033 19.521 34.649 L 19.521 11.156 C 19.521 5.772 23.773 1.368 28.97 1.368 L 28.97 1.368 C 34.166 1.368 38.418 5.772 38.418 11.156 L 38.418 34.649 C 38.418 40.033 34.166 44.438 28.97 44.438 Z"/>
                        <path d="M 29 46 C 35.065 46 40 41.065 40 35 L 40 11 C 40 4.935 35.065 0 29 0 C 22.935 0 18 4.935 18 11 L 18 35 C 18 41.065 22.935 46 29 46 Z M 20 11 C 20 6.037 24.038 2 29 2 C 33.962 2 38 6.037 38 11 L 38 35 C 38 39.963 33.962 44 29 44 C 24.038 44 20 39.963 20 35 L 20 11 Z"/>
                    </svg>
                </button>

            </div >
        );
    }
}

export const Shell = connect(
    (state: ChatState) => ({
        // passed down to ShellContainer
        inputText: state.shell.input,
        showUploadButton: state.format.showUploadButton,
        inputEnabled: state.history.inputEnabled,
        placeholder: state.shell.placeholder || defaultStrings.consolePlaceholder,
        strings: state.format.strings,
        // only used to create helper functions below
        locale: state.format.locale,
        user: state.connection.user,
        listeningState: state.shell.listeningState,
        fullscreen: state.format.fullscreen,
        themeColor: state.format.themeColor,
        botConnection: state.connection.botConnection
        
    }), {
        // passed down to ShellContainer
        onChangeText: (input: string) => ({ type: 'Update_Input', input, source: 'text' } as ChatActions),
        stopListening:  () => ({ type: 'Listening_Stopping' }),
        startListening:  () => ({ type: 'Listening_Starting' }),
        // only used to create helper functions below
        sendMessage,
        sendFiles
    }, (stateProps: any, dispatchProps: any, ownProps: any): Props => ({
        // from stateProps
        inputText: stateProps.inputText,
        placeholder: stateProps.placeholder,
        showUploadButton: stateProps.showUploadButton,
        inputEnabled: stateProps.inputEnabled,
        strings: stateProps.strings,
        listeningState: stateProps.listeningState,
        fullscreen: stateProps.fullscreen,
        themeColor: stateProps.themeColor,
        gid: stateProps.string,
        // from dispatchProps
        onChangeText: dispatchProps.onChangeText,
        botConnection: stateProps.botConnection,
        // helper functions
        sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
        sendFiles: (files: FileList) => dispatchProps.sendFiles(files, stateProps.user, stateProps.locale),
        startListening: () => dispatchProps.startListening(),
        stopListening: () => dispatchProps.stopListening()
    }), {
        withRef: true
    }
) ( ShellContainer );
