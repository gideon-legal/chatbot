import { Activity, CardAction, DirectLineOptions, Message} from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import PlacesAutocomplete from 'react-places-autocomplete';
import {
  geocodeByAddress,
  geocodeByPlaceId,
  getLatLng
} from 'react-places-autocomplete';
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
  addressComponents: AddressComponents;
}

export interface AddressComponents {
  street_address_1: string;
  street_address_2: string;
  city: string;
  county: string;
  state: string;
  zipcode: string;
  country: string;
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
      suggestionsShown: false,
      addressComponents: {
        street_address_1: undefined,
        street_address_2: undefined,
        city: undefined,
        county: undefined,
        state: undefined,
        zipcode: undefined,
        country: undefined
      }
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

  formatAddressFromComponents = () => {
    let address = this.state.addressComponents.street_address_1;
    if (!!this.state.addressComponents.street_address_2) {
      address = `${address}, ${this.state.addressComponents.street_address_2}`;
    }
    address = `${address}, ${this.state.addressComponents.city}`;
    address = `${address}, ${this.state.addressComponents.state}`;
    address = `${address}, ${this.state.addressComponents.zipcode}`;
    address = `${address}, ${this.state.addressComponents.country}`;

    return address;
  }

  clickToSubmitAddressInformation(e: React.MouseEvent<HTMLButtonElement>) {
    if (!this.validateAddress()) { return; }

    this.resetShell();
    this.props.sendMessage(this.formatAddressFromComponents());

    e.stopPropagation();
  }

  handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && this.validateAddress()) {
      this.resetShell();
      this.props.sendMessage(this.formatAddressFromComponents());
    }
  }

  handleAddressChange = (value: string) => {
    this.setState({
      ...this.state,
      addressSelected: '',
      addressTyped: value,
      addressComponents: {
        street_address_1: undefined,
        street_address_2: undefined,
        city: undefined,
        county: undefined,
        state: undefined,
        zipcode: undefined,
        country: undefined
      }
    });
  }

  getComponentFromGeocodeResult = (components: google.maps.GeocoderAddressComponent[], key: string) => {
    const componentObject = components.find(c => c.types.includes(key));
    return componentObject && componentObject.long_name ? componentObject.long_name : undefined;
  }

  handleAddressSelect = (address: string, placeId: string) => {
    if (this.state.addressSelected === address) {
      this.resetShell();
      this.props.sendMessage(this.formatAddressFromComponents());
      return;
    }

    geocodeByPlaceId(placeId)
      .then(results => {
        if (results.length > 0) {
          const components = results[0].address_components;

          const streetNumber = this.getComponentFromGeocodeResult(components, 'street_number');
          const street = this.getComponentFromGeocodeResult(components, 'route');
          const city = this.getComponentFromGeocodeResult(components, 'locality');
          const county = this.getComponentFromGeocodeResult(components, 'administrative_area_level_2');
          const state = this.getComponentFromGeocodeResult(components, 'administrative_area_level_1');
          const zip = this.getComponentFromGeocodeResult(components, 'postal_code');
          const zipSuffix = this.getComponentFromGeocodeResult(components, 'postal_code_suffix');
          const country = this.getComponentFromGeocodeResult(components, 'country');

          const zipFull = !!zipSuffix ? `${zip}-${zipSuffix}` : zip;

          this.setState({
            ...this.state,
            addressSelected: address,
            addressTyped: address,
            addressComponents: {
              street_address_1: `${streetNumber} ${street}`,
              street_address_2: undefined,
              city,
              county,
              state,
              zipcode: zipFull,
              country
            }
          });
        }
      })
      .catch(error => console.error('geocode error', error));
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
        {this.state.addressComponents.street_address_1 && <div className="address__form__card__components">
          <span>Street Address</span>
          <input
            className="address__form__card__components__street__1"
            value={this.state.addressComponents.street_address_1}
            readOnly
          />
          <span>Unit/Apartment</span>
          <input
            className="address__form__card__components__street__2"
            value={this.state.addressComponents.street_address_2}
            onKeyDown={e => this.handleKeyPress(e)}
            onChange={e => this.setState({
                ...this.state,
                addressComponents: {
                  ...this.state.addressComponents,
                  street_address_2: e.target.value
                }
              })
            }
          />
          <span>City</span>
          <input
            className="address__form__card__components__city"
            value={this.state.addressComponents.city}
            readOnly
          />
          <span>State/Province</span>
          <input
            className="address__form__card__components__state"
            value={this.state.addressComponents.state}
            readOnly
          />
          <span>Postal Code</span>
          <input
            className="address__form__card__components__postal__code"
            value={this.state.addressComponents.zipcode}
            readOnly
          />
          <span>Country</span>
          <input
            className="address__form__card__components__country"
            value={this.state.addressComponents.country}
            readOnly
          />
        </div>}
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
