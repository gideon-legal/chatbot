import { Activity, CardAction, DirectLine, DirectLineOptions, Message } from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import Autocomplete from 'react-google-autocomplete';
import { connect } from 'react-redux';
import { activityWithSuggestedActions } from './activityWithSuggestedActions';
import { doCardAction, IDoCardAction } from './Chat';
import { FormattedText } from './FormattedText';
import { filteredActivities } from './History';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import { defaultStrings } from './Strings';

export interface Node {
    node_type: string;
    meta: any;
}

interface AddressProps {
    node: Node;
    sendMessage: (inputText: string) => void;
    directLine?: DirectLineOptions;
    gid: string;
    conversationId: string;
    withTime: boolean;
    updateInput: (disable: boolean, placeholder: string) => void;
}

export interface MessageWithAddress extends Message {
    address: string;
}

export interface AddressState {
    address: string;
    addressError: string;
    formattedMessage: string;
}

class AddressForm extends React.Component<AddressProps, AddressState> {
    private textInputAddress: HTMLInputElement;

    constructor(props: AddressProps) {
        super(props);

        this.state = {
            address: '',
            addressError: undefined,
            formattedMessage: ''
        };

        console.log(this.props);

        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    componentDidMount() {
        this.props.updateInput(
            true,
            'Please enter your address.'
        );
    }

    getFormattedAddress = () => {
        return JSON.stringify({
            ...this.state.address && { email: this.state.address }

        });
    }

    private handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): any {
        if (e.key === 'Enter') {
            this.resetShell();
            this.props.sendMessage(this.getFormattedAddress());
            document.removeEventListener('keypress', this.handleKeyDown.bind(this));
        }
    }

    resetShell = () => {
        this.props.updateInput(
            false,
            defaultStrings.consolePlaceholder
        );
    }

    private onKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            this.resetShell();
            this.props.sendMessage(this.getFormattedAddress());
            document.removeEventListener('keypress', this.handleKeyDown.bind(this));
        }
    }

    render() {
        return (
            <div className="address__card">
                <div className="address__card__container">
                    <span className={'address__card__container__title'}>Name</span>
                    <input
                        type="text"
                        className={'address__card__container__input'}
                        ref={input => this.textInputAddress = input}
                        autoFocus={true}
                        value={this.state.address}
                        onChange={e => this.setState({
                            ...this.state,
                            address: e.target.value
                        })}
                        onKeyPress={e => this.onKeyPress(e)}
                        // onFocus={ () => this.onTextInputFocus() }
                        placeholder="Address"
                        aria-label={null}
                        aria-live="polite"
                    />
                    {this.state.addressError && <span className="address__card__container__error">{this.state.addressError}</span>}
                </div>
            </div>
        );
    }
}

export const AddressCard = connect(
    (state: ChatState) => {
        return {
            // passed down to MessagePaneView
            locale: state.format.locale,
            user: state.connection.user,
            conversationId: state.connection.botConnection.conversationId
        };
    }, {
    updateInput: (disable: boolean, placeholder: string) =>
    ({
        type: 'Update_Input',
        placeholder,
        disable,
        source: 'text'
    } as ChatActions),
    sendMessage
}, (stateProps: any, dispatchProps: any, ownProps: any): AddressProps => {
    return {
        // from stateProps
        node: ownProps.node,
        withTime: ownProps.withTime,
        // from dispatchProps
        sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
        gid: ownProps.gid,
        directLine: ownProps.directLine,
        conversationId: stateProps.conversationId,
        updateInput: dispatchProps.updateInput
    };
}
)(AddressForm);
