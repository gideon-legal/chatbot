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

export interface ContactFormState {
    address: string;
    addressError: string; 
    formattedMessage: string;
  }