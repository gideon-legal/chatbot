/* eslint-disable */
import { Activity, CardAction, DirectLine, DirectLineOptions, Message } from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import Autocomplete, { usePlacesWidget } from 'react-google-autocomplete';
import PlacesAutocomplete, {
    geocodeByAddress,
    getLatLng
  } from 'react-places-autocomplete';
import { connect } from 'react-redux';
import { activityWithSuggestedActions } from './activityWithSuggestedActions';
import { doCardAction, IDoCardAction } from './Chat';
import { FormattedText } from './FormattedText';
import { filteredActivities } from './History';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import { defaultStrings } from './Strings';
import {SubmitButton} from './SubmitButton';

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
    apartment: string;
}

export interface AddressState {
    address: string;
    addressSelected: boolean;
    addressError: string;
    formattedMessage: string;
    apartment: string;
    apartmentError: string;
}

class AddressForm extends React.Component<AddressProps, AddressState> {
    private textInputAddress: HTMLInputElement;

    constructor(props: AddressProps) {
        super(props);

        this.state = {
            address: '',
            addressError: undefined,
            addressSelected: false,
            formattedMessage: '',
            apartment: '',
            apartmentError: undefined
        };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.clickToSubmitContactInformation = this.clickToSubmitContactInformation.bind(this);
    }

    componentDidMount() {
        this.props.updateInput(
            true,
            'Please enter your address.'
        );
    }

    getFormattedAddress = () => {
        const addressArr = this.state.address.split(',');
        let addressWApt = this.state.address;
        if (this.state.apartment !== '') {
            addressWApt = addressArr[0] + ', ' + this.state.apartment + ',' + addressArr[1] + ',' + addressArr[2] + ',' + addressArr[3];
        }
        // has: street, city, state - zipcode, country
        const stateZip = addressArr[2].split(' ');
        if (stateZip.length === 3) {
            // contains zip code
            return(JSON.stringify({
                address: addressWApt,
                apartment: this.state.apartment,
                street: addressArr[0],
                city: addressArr[1],
                state: stateZip[1],
                zipcode: stateZip[2]
            }));
        } else {
            return(JSON.stringify({
                address: addressWApt,
                apartment: this.state.apartment,
                street: addressArr[0],
                city: addressArr[1],
                state: stateZip[1],
                zipcode: ''
            }));
        }
    }

    apartmentActive = () => {
        return this.props.node.meta && this.props.node.meta.apartment;
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

    clickToSubmitContactInformation(e: React.MouseEvent<HTMLButtonElement>) {
      // if (!this.validateContactInformation()) { return; }
      this.resetShell();
      this.props.sendMessage(this.getFormattedAddress());
      document.removeEventListener('keypress', this.handleKeyDown.bind(this));
      e.stopPropagation();
    }

    handleChange(address: string) {
        this.setState({ address, addressSelected: false });
    }

    handleSelect(address: string) {
        if (this.state.addressSelected) { // send message
            this.resetShell();
            this.props.sendMessage(this.getFormattedAddress());
            document.removeEventListener('keypress', this.handleKeyDown.bind(this));
            return;
        }
        this.setState({ address, addressSelected: true });
        geocodeByAddress(address)
            .then(results => getLatLng(results[0]))
            .then(latLang => {
                console.log('Success', address);
            })
            .catch(error => console.error('Error', error));
    }

    render() {
        return (
            <div className="contact__form__card">
                <div className="contact__form__card__container">
                    <span className={'contact_label'}><b>Address</b></span>
                    <PlacesAutocomplete
                        value={this.state.address}
                        onChange={this.handleChange}
                        onSelect={this.handleSelect}
                    >
                        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                            <div>
                                <input
                                    {...getInputProps({
                                        placeholder: 'Search Places ...',
                                        className: 'contact__form__card__container__input'
                                    })}
                                    onKeyPress={ e => this.onKeyPress(e) }
                                />
                                <div className="autocomplete-dropdown-container">
                                    {loading && <div>Loading...</div>}
                                    {suggestions.map(suggestion => {
                                        const className = suggestion.active
                                            ? 'address-suggestion-item-active'
                                            : 'address-suggestion-item';
                                        const style = suggestion.active
                                            ? { backgroundColor: '#fafafa', cursor: 'pointer', color: 'black' }
                                            : { backgroundColor: '#ffffff', cursor: 'pointer', color: 'black' };
                                        return (
                                            <div
                                                {...getSuggestionItemProps(suggestion, {
                                                    className,
                                                    style
                                                })}
                                            >
                                                <span>{suggestion.description}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </PlacesAutocomplete>
                    {this.apartmentActive() && (<div className="address-apartment-container">
                    <input
                       type="text"
                       className={'contact__form__card__container__input'}
                       // ref={ input => this.textInputName = input }
                       value={ this.state.apartment }
                       onChange={ e => this.setState({
                       ...this.state,
                       apartment: e.target.value
                       }) }
                      placeholder="Apt/Suite Number (Optional)"
                       aria-label={null}
                       aria-live="polite"
                       onKeyPress={ e => this.onKeyPress(e) }
                    />
                    </div>)}
                    {this.state.addressError && <span className="contact__form__card__container__error">{this.state.addressError}</span>}
                </div>
                <SubmitButton onClick={ this.clickToSubmitContactInformation } />
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
