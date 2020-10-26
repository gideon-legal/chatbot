import { DirectLineOptions, Message } from 'botframework-directlinejs';
import * as React from 'react';
import { connect } from 'react-redux';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';

export interface Node {
  node_type: string;
  meta: any;
  validation: string;
}

interface RestartPromptProps {
  node: Node;
  directLine?: DirectLineOptions;
  sendMessage: () => void;
  gid: string;
  conversationId: string;
  withTime: boolean;
  updateInput: (disable: boolean, placeholder: string) => void;
  handleNewConversationClick: () => void;
}

class RestartPrompt extends React.Component<RestartPromptProps> {
  render() {
    return (
      <div className="actions">
        <button type="button" onClick={() => this.props.handleNewConversationClick()}>
          New Conversation
        </button>
        <button type="button" onClick={() => this.props.sendMessage()}>
          Continue Conversation
        </button>
      </div>
    );
  }
}

export const RestartPromptCard = connect(
  (state: ChatState) => {
    return {
      locale: state.format.locale,
      user: state.connection.user,
      conversationId: state.connection.botConnection.conversationId,
      restartMessage: state.format.strings.restartMessage
    };
  }, {
    updateInput: (disable: boolean, placeholder: string) =>
          ({
              type: 'Update_Input',
              placeholder,
              disable,
              source: 'text'
          } as ChatActions),
    sendMessage,
    clearMessages: () => ({ type: 'Set_Messages', activities: [] } as ChatActions),
    clearSelectedConversation: () => ({ type: 'Set_Selected_Conversation', conversation: null } as ChatActions)
  }, (stateProps: any, dispatchProps: any, ownProps: any): RestartPromptProps => {
    return {
      // from stateProps
      node: ownProps.node,
      withTime: ownProps.withTime,
      // from dispatchProps
      sendMessage: () => dispatchProps.sendMessage(stateProps.restartMessage, stateProps.user, stateProps.locale),
      gid: ownProps.gid,
      directLine: ownProps.directLine,
      conversationId: stateProps.conversationId,
      updateInput: dispatchProps.updateInput,
      handleNewConversationClick: async () => {
        await dispatchProps.clearMessages();
        await dispatchProps.clearSelectedConversation();
        await ownProps.setNewConversation();
      }
    };
  }
)(RestartPrompt);
