import { Activity, CardAction, DirectLine, DirectLineOptions, Message} from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import { connect } from 'react-redux';
import { activityWithSuggestedActions } from './activityWithSuggestedActions';
import { doCardAction, IDoCardAction } from './Chat';
import { FormattedText } from './FormattedText';
import { filteredActivities } from './History';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';

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
    address: string
}

export interface AddressState {
    address: string;
    addressError: string; 
    formattedMessage: string;
  }

  class AddressForm extends React.Component<AddressProps, AddressState> {
    private textInputAddress: HTMLInputElement;
  }

  export const AddressCard = connect(
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
    }, (stateProps: any, dispatchProps: any, ownProps: any): AddressProps => {
      return {
        // from stateProps
        node:       ownProps.node,
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