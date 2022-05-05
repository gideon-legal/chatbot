import { User } from 'botframework-directlinejs';
import * as color from 'color';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { classList } from './Chat';
import { Speech } from './SpeechModule';
import { ChatState, FormatState } from './Store';
import { ChatActions, ListeningState, sendFiles, sendMessage } from './Store';
import { defaultStrings, Strings } from './Strings';

interface Props {
    inputText: string;
    placeholder: string;
    strings: Strings;
    listeningState: ListeningState;
    showUploadButton: boolean;
    inputDisabled: boolean;
    themeColor: string;
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
            this.props.inputDisabled && 'wc-console__disabled',
            this.props.inputText.length > 0 && 'has-text',
            showUploadButton && 'has-upload-button'
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
                        disabled={ this.props.inputDisabled }
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

                    // Send message arrow vector
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
        inputDisabled: state.shell.inputDisabled,
        placeholder: state.shell.placeholder || defaultStrings.consolePlaceholder,
        strings: state.format.strings,
        // only used to create helper functions below
        locale: state.format.locale,
        user: state.connection.user,
        listeningState: state.shell.listeningState,
        themeColor: state.format.themeColor
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
        inputDisabled: stateProps.inputDisabled,
        strings: stateProps.strings,
        listeningState: stateProps.listeningState,
        themeColor: stateProps.themeColor,
        // from dispatchProps
        onChangeText: dispatchProps.onChangeText,
        // helper functions
        sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
        sendFiles: (files: FileList) => dispatchProps.sendFiles(files, stateProps.user, stateProps.locale),
        startListening: () => dispatchProps.startListening(),
        stopListening: () => dispatchProps.stopListening()
    }), {
        withRef: true
    }
) ( ShellContainer );
