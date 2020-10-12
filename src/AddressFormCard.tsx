import { Activity, CardAction, DirectLineOptions, Message} from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
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
  address: string;
  addressError: string;
}

class AddressForm extends React.Component<AddressFormProps, AddressFormState> {

  constructor(props: AddressFormProps) {
    super(props);

    this.state = {
      address: '',
      addressError: undefined
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    this.props.updateInput(
        true,
        'Please enter your contact information.'
    );
  }

  private handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): any {
    if (e.key === 'Enter' && this.validateAddress()) {
        this.resetShell();
        this.props.sendMessage(this.state.address);
        document.removeEventListener('keypress', this.handleKeyDown.bind(this));
    }
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

    if (this.state.address === '') {
      addressError = 'Please enter your address';
      validated = false;
    }

    this.setState({
      ...this.state,
      addressError
    });

    return validated;
  }

  clickToSubmitContactInformation(e: React.MouseEvent<HTMLButtonElement>) {
    if (!this.validateAddress()) { return; }

    this.resetShell();
    this.props.sendMessage(this.state.address);

    document.removeEventListener('keypress', this.handleKeyDown.bind(this));

    e.stopPropagation();
  }

  private onKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && this.validateAddress()) {
        this.resetShell();
        this.props.sendMessage(this.state.address);
        document.removeEventListener('keypress', this.handleKeyDown.bind(this));
    }
  }

  render() {
    console.log('AddressFormCard');
    return <div><span>ADDRESS FORM CARD</span></div>;
  }
}

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
