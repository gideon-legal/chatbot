import { DirectLineOptions, Message} from 'botframework-directlinejs';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import * as React from 'react';
import { connect } from 'react-redux';
import { NodeCustomContainer } from './nodes/containers/NodeCustomContainer';
import {NodeHeader} from './nodes/containers/NodeHeader';
import {NodeInputContainer} from './nodes/containers/NodeInputContainer';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import { defaultStrings } from './Strings';
import {SubmitButton} from './SubmitButton';

export interface Node {
  node_type: string;
  meta: any;
  validation: string;
}

interface TimeCardProps {
  node: Node;
  directLine?: DirectLineOptions;
  sendMessage: (inputText: string) => void;
  gid: string;
  conversationId: string;
  withTime: boolean;
}

export interface MessageWithContact extends Message {
  name: string;
  phone: string;
  email: string;
}

export interface TimeCardState {
    time: string;
    time_marker: string;
    timeError: string;
    time_markerError: string;
}

class TimeCard extends React.Component<TimeCardProps, TimeCardState> {
  private radialInputTimeMarker: HTMLInputElement;
  private textInputTime: HTMLInputElement;
  

  constructor(props: TimeCardProps) {
    super(props);

    this.state = {
      time: '',
      timeError: '',
      time_marker: 'am',
      time_markerError: ''
      
    };


    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.onChangeValue = this.onChangeValue.bind(this);
    this.clickToSubmitTime = this.clickToSubmitTime.bind(this);
  }

  private handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): any {
    if (e.key === 'Enter' && this.validateContactInformation()) {
        this.props.sendMessage(this.getFormattedTime());
        document.removeEventListener('keypress', this.handleKeyDown.bind(this));
    }
  }

  validateEmail = (email: string) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  }

  validatePhone = (phone: string) => {
    const phoneNumber = parsePhoneNumberFromString(phone, 'US');
    return phoneNumber && phoneNumber.isValid();
  }

  validateContactInformation = () => {
    let validated = true;

    let time_markerError;
    let timeError;

    if (!(this.state.time_marker && this.state.time_marker !== '')) {
      time_markerError = 'Please select am or pm';
      validated = false;
    }

    if ( !(this.state.time && this.state.time !== '')) {
      timeError = 'Please enter a time';
      validated = false;
    }

   

    this.setState({
      ...this.state,
      timeError,
      time_markerError
    });

    return validated;
  }

  getFormattedTime = () => {
    return JSON.stringify({
      ...this.state.time && { email: this.state.time},
      ...this.state.time_marker && { phone: this.state.time_marker }
      
    });
  }

 

  clickToSubmitTime(e: React.MouseEvent<HTMLButtonElement>) {
    if (!this.validateContactInformation()) { return; }

    this.props.sendMessage(this.getFormattedTime());

    document.removeEventListener('keypress', this.handleKeyDown.bind(this));

    e.stopPropagation();
  }

  private onKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && this.validateContactInformation()) {
        this.props.sendMessage(this.getFormattedTime());
        document.removeEventListener('keypress', this.handleKeyDown.bind(this));
    }
  }

  onChangeValue(event: React.ChangeEvent<HTMLInputElement>) {
    const time_marker = event.target.value;
    this.setState({
      ...this.state,
      time_marker
    });
  }

  render() {
    return (
      <div className="contact__form__card gideon__node">
        <NodeHeader
          nodeType="contact__form__card"
          header="Contact Information"
        />
        {(<NodeCustomContainer
          nodeType="contact__form__card"

          title={{
            title: 'Title ',
            required: true
          }}

          content={
            <div className="prefix__radio">
              <label className="prefix_label">
                <input
                  type="radio"
                  value="pm"
                  id="pm"
                  onChange={this.onChangeValue}/>
                  <span className="checkmark"></span>
                  <span className="prefix_text">Mr.</span>
              </label>
              <label className="prefix_label">
                <input
                  type="radio"
                  name="prefix"
                  value="am"
                  id="am"
                  onChange={this.onChangeValue}/>
                <span className="checkmark"></span>
                <span className="prefix_text">Mrs.</span>
              </label>
            </div>
          }

          error={{
            message: this.state.time_markerError
          }}

          errorOn={this.state.time_markerError}
        />)}

        {(<NodeInputContainer
          nodeType="contact__form__card"

          title={{
            title: 'Time ',
            required: true
          }}

          input={{
            type: 'text',
            ref: input => this.textInputTime = input,
            autoFocus: true,
            value: this.state.time,
            onChange: e => this.setState({
              ...this.state,
              time: e.target.value
            }),
            onKeyPress: e => this.onKeyPress(e),
            placeholder: 'HHMM',
            ariaLabel: null,
            ariaLive: 'polite'
          }}

          error={{
            message: this.state.timeError
          }}

          errorOn={
            this.state.timeError
          }
        />)}
      
        <SubmitButton onClick={this.clickToSubmitTime} />
      </div>
    );
  }
}

export const TimeNode = connect(
  (state: ChatState) => {
    return {
      // passed down to MessagePaneView
      locale:       state.format.locale,
      user: state.connection.user,
      conversationId: state.connection.botConnection.conversationId
    };
  }, {
    sendMessage
  }, (stateProps: any, dispatchProps: any, ownProps: any): TimeCardProps => {
    return {
      // from stateProps
      node:       ownProps.node,
      withTime: ownProps.withTime,
      // from dispatchProps
      sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
      gid: ownProps.gid,
      directLine: ownProps.directLine,
      conversationId: stateProps.conversationId
    };
  }
)(TimeCard);
