import { Activity, CardAction, DirectLineOptions, Message} from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import PlacesAutocomplete from 'react-places-autocomplete';
import { connect } from 'react-redux';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import { defaultStrings } from './Strings';

export interface Node {
  node_type: string;
  meta: any;
}

interface AddressFormProps {
  node: Node;
  directLine?: DirectLineOptions;
  sendMessage: (inputText: string) => void;
  gid: string;
  conversationId: string;
  updateInput: (disable: boolean, placeholder: string) => void;
}

export interface AddressFormState {
  addressTyped: string;
  addressSelected: string;
  addressError: string;
  loaded: boolean;
  suggestionsShown: boolean;
}

class AddressForm extends React.Component<AddressFormProps, AddressFormState> {
  private bottomDiv: HTMLDivElement;

  constructor(props: AddressFormProps) {
    super(props);

    this.state = {
      addressTyped: '',
      addressSelected: '',
      addressError: undefined,
      loaded: false,
      suggestionsShown: false
    };
  }

  componentDidMount() {
    loadGMaps(() => this.setState({...this.state, loaded: true}));
    this.props.updateInput(
        true,
        'Please enter your address.'
    );
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  resetShell = () => {
    this.props.updateInput(
      false,
      defaultStrings.consolePlaceholder
    );
  }

  validateAddress = () => {
    let validated = true;

    let addressError;

    if (this.state.addressSelected === '') {
      addressError = 'Please select your address';
      validated = false;
    }

    this.setState({
      ...this.state,
      addressError
    });

    return validated;
  }

  clickToSubmitAddressInformation(e: React.MouseEvent<HTMLButtonElement>) {
    if (!this.validateAddress()) { return; }

    this.resetShell();
    this.props.sendMessage(this.state.addressSelected);

    e.stopPropagation();
  }

  handleAddressChange = (value: string) => {
    this.setState({ addressTyped: value, addressSelected: '' });
  }

  handleAddressSelect = (address: string, placeId: string) => {
    if (this.state.addressSelected === address) {
      this.resetShell();
      this.props.sendMessage(this.state.addressSelected);
      return;
    }

    this.setState({...this.state, addressSelected: address, addressTyped: address});
  }

  scrollToBottom = () => {
    this.bottomDiv.scrollIntoView({ behavior: 'auto' });
  }

  render() {
    return (
      <div className="address__form__card">
        <span className="address__form__card__title">Address</span>
        {this.state.loaded && <PlacesAutocomplete
          value={this.state.addressTyped}
          onChange={this.handleAddressChange}
          onSelect={this.handleAddressSelect}
        >
          {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
          <div className="address__form__card__places__autocomplete">
            <input
              {...getInputProps({
                placeholder: 'Type and select your address...',
                className: 'location-search-input'
              })}
            />
            {suggestions && suggestions.length > 0 && <div className="autocomplete-dropdown-container">
              {suggestions.map((suggestion, index) => {
                const className = suggestion.active ? 'suggestion-item--active' : 'suggestion-item';
                // this check and suggestionsShown forces a rerender the first time
                // the suggestions are rendered, to force it to the bottom of the scrollable view
                if (index === suggestions.length - 1 && !this.state.suggestionsShown) {
                  this.setState({...this.state, suggestionsShown: true});
                }
                return (
                  <div
                    {...getSuggestionItemProps(suggestion, {
                      className
                    })}
                  >
                    <span>{suggestion.description}</span>
                    {index < (suggestions.length - 1) && <hr></hr>}
                  </div>
                );
              })}
            </div>}
          </div>
        )}
        </PlacesAutocomplete>}
        <button className="address__form__card__submit" onClick={e => this.clickToSubmitAddressInformation(e)}>Submit</button>
        <div ref={el => this.bottomDiv = el}></div>
      </div>
    );
  }
}

const loadGMaps = (callback: () => void): void => {
  const existingScript = document.getElementById('googleMaps');
  const apiKey = 'AIzaSyAOv4N527oPcQv88xxMKEILQuQ4Y0CcgG0';
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.id = 'googleMaps';
    document.body.appendChild(script);
    script.onload = () => {
      if (callback) { callback(); }
    };
  }
  if (existingScript && callback) { callback(); }
};

export default loadGMaps;

export const AddressFormCard = connect(
  (state: ChatState) => {
    return {
      // passed down to MessagePaneView
      locale:       state.format.locale,
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
  }, (stateProps: any, dispatchProps: any, ownProps: any): AddressFormProps => {
    return {
      // from stateProps
      node:       ownProps.node,
      // from dispatchProps
      sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
      gid: ownProps.gid,
      directLine: ownProps.directLine,
      conversationId: stateProps.conversationId,
      updateInput: dispatchProps.updateInput
    };
  }
)(AddressForm);
