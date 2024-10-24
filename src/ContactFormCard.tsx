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

interface ContactFormProps {
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

export interface ContactFormState {
  prefix: string;
  prefixError: string;
  name: string;
  nameError: string;
  email: string;
  emailError: string;
  phone: string;
  phoneError: string;
  formattedMessage: string;
  first_name: string;
  firstNameError: string;
  last_name: string;
  lastNameError: string;
  middle_name: string;
  middleNameError: string;
}

class ContactForm extends React.Component<ContactFormProps, ContactFormState> {
  private radialInputPrefix: HTMLInputElement;
  private textInputName: HTMLInputElement;
  private textInputEmail: HTMLInputElement;
  private textInputPhone: HTMLInputElement;

  constructor(props: ContactFormProps) {
    super(props);

    this.state = {
      prefix: '',
      prefixError: undefined,
      name: '',
      nameError: undefined,
      email: '',
      emailError: undefined,
      phone: '',
      phoneError: undefined,
      formattedMessage: '',
      first_name: '',
      firstNameError: undefined,
      last_name: '',
      lastNameError: undefined,
      middle_name: '',
      middleNameError: undefined
    };


    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.onChangeValue = this.onChangeValue.bind(this);
    this.clickToSubmitContactInformation = this.clickToSubmitContactInformation.bind(this);
  }

  private handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): any {
    if (e.key === 'Enter' && this.validateContactInformation()) {
        this.props.sendMessage(this.getFormattedContact());
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

    let nameError;
    let phoneError;
    let emailError;
    let prefixError;
    let firstNameError;
    let middleNameError;
    let lastNameError;

    if (this.prefixActive() && !(this.state.prefix && this.state.prefix !== '')) {
      prefixError = 'Please select a prefix';
      validated = false;
    }

    if (this.nameActive() && !(this.firstNameActive() || this.lastNameActive() || this.middleNameActive()) && !(this.state.name && this.state.name !== '')) {
      nameError = 'Please enter a name';
      validated = false;
    }

    if (this.emailActive() && !(this.validateEmail(this.state.email))) {
      emailError = 'That email doesn\'t look quite right';
      validated = false;
    }

    if (this.phoneActive() && !this.validatePhone(this.state.phone)) {
      phoneError = 'That phone number doesn\'t look quite right';
      validated = false;
    }

    if (this.nameActive() && this.firstNameActive() && !(this.state.first_name && this.state.first_name !== '')) {
      firstNameError = 'Please enter a first name';
      validated = false;
    }

    if (this.nameActive() && this.middleNameActive() && !(this.state.middle_name && this.state.middle_name !== '')) {
      middleNameError = 'Please enter a middle name';
      validated = false;
    }

    if (this.nameActive() && this.lastNameActive() && !(this.state.last_name && this.state.last_name !== '')) {
      lastNameError = 'Please enter a last name';
      validated = false;
    }

    this.setState({
      ...this.state,
      prefixError,
      nameError,
      emailError,
      phoneError,
      firstNameError,
      middleNameError,
      lastNameError
    });

    return validated;
  }

  getFormattedContact = () => {
    return JSON.stringify({
      ...this.state.email && { email: this.state.email },
      ...this.state.phone && { phone: this.state.phone },
      ...this.state.prefix && { prefix: this.state.prefix },
      ...this.state.name && { name: this.state.name },
      ...this.state.first_name && { first_name: this.state.first_name },
      ...this.state.middle_name && { middle_name: this.state.middle_name },
      ...this.state.last_name && { last_name: this.state.last_name }
    });
  }

  prefixActive = () => {
    return this.props.node.meta && this.props.node.meta.prefix;
  }

  nameActive = () => {
    return this.props.node.meta && this.props.node.meta.name;
  }

  emailActive = () => {
    return this.props.node.meta && this.props.node.meta.email || (!this.props.node.meta && this.props.node.validation === 'email');
  }

  phoneActive = () => {
    return this.props.node.meta && this.props.node.meta.phone || (!this.props.node.meta && this.props.node.validation === 'phone');
  }

  firstNameActive = () => {
    return this.props.node.meta && this.props.node.meta.name && this.props.node.meta.first_name;
  }

  lastNameActive = () => {
    return this.props.node.meta && this.props.node.meta.name && this.props.node.meta.last_name;
  }

  middleNameActive = () => {
    return this.props.node.meta && this.props.node.meta.name && this.props.node.meta.middle_name;
  }

  clickToSubmitContactInformation(e: React.MouseEvent<HTMLButtonElement>) {
    if (!this.validateContactInformation()) { return; }

    this.props.sendMessage(this.getFormattedContact());

    document.removeEventListener('keypress', this.handleKeyDown.bind(this));

    e.stopPropagation();
  }

  private onKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && this.validateContactInformation()) {
        this.props.sendMessage(this.getFormattedContact());
        document.removeEventListener('keypress', this.handleKeyDown.bind(this));
    }
  }

  onChangeValue(event: React.ChangeEvent<HTMLInputElement>) {
    const prefix = event.target.value;
    this.setState({
      ...this.state,
      prefix
    });
  }

  render() {
    return (
      <div className="contact__form__card gideon__node">
        <NodeHeader
          nodeType="contact__form__card"
          header="Contact Information"
        />
        {this.prefixActive() && (<NodeCustomContainer
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
                  name="prefix"
                  value="Mr."
                  id="mr"
                  onChange={this.onChangeValue}/>
                  <span className="checkmark"></span>
                  <span className="prefix_text">Mr.</span>
              </label>
              <label className="prefix_label">
                <input
                  type="radio"
                  name="prefix"
                  value="Mrs."
                  id="mrs"
                  onChange={this.onChangeValue}/>
                <span className="checkmark"></span>
                <span className="prefix_text">Mrs.</span>
              </label>
              <label className="prefix_label">
                <input
                  type="radio"
                  name="prefix"
                  value="Ms."
                  id="ms"
                  onChange={this.onChangeValue}/>
                <span className="checkmark"></span>
                <span className="prefix_text">Ms.</span>
              </label>
              <label className="prefix_label">
                <input
                  type="radio"
                  name="prefix"
                  value="Mx."
                  id="mx"
                  onChange={this.onChangeValue}/>
                <span className="checkmark"></span>
                <span className="prefix_text">Mx.</span>
              </label>
              <label className="prefix_label">
                <input
                  type="radio"
                  name="prefix"
                  value="Dr."
                  id="dr"
                  onChange={this.onChangeValue}/>
                <span className="checkmark"></span>
                <span className="prefix_text">Dr.</span>
              </label>
            </div>
          }

          error={{
            message: this.state.prefixError
          }}

          errorOn={this.state.prefixError}
        />)}

        {this.nameActive() && !(this.firstNameActive() || this.middleNameActive() || this.lastNameActive()) && (<NodeInputContainer
          nodeType="contact__form__card"

          title={{
            title: 'Name ',
            required: true
          }}

          input={{
            type: 'text',
            ref: input => this.textInputName = input,
            autoFocus: true,
            value: this.state.name,
            onChange: e => this.setState({
              ...this.state,
              name: e.target.value
            }),
            onKeyPress: e => this.onKeyPress(e),
            placeholder: 'First and Last Name',
            ariaLabel: null,
            ariaLive: 'polite'
          }}

          error={{
            message: this.state.nameError
          }}

          errorOn={
            this.state.nameError
          }
        />)}
        {this.nameActive() && this.firstNameActive()  && (<NodeInputContainer
          nodeType="contact__form__card"

          title={{
            title: 'First Name ',
            required: true
          }}

          input={{
            type: 'text',
            ref: input => this.textInputName = input,
            autoFocus: true,
            value: this.state.first_name,
            onChange: e => this.setState({
              ...this.state,
              first_name: e.target.value
            }),
            onKeyPress: e => this.onKeyPress(e),
            placeholder: 'First Name',
            ariaLabel: null,
            ariaLive: 'polite'
          }}

          error={{
            message: this.state.firstNameError
          }}

          errorOn={
            this.state.firstNameError
          }
        />)}
        {this.nameActive() && this.middleNameActive()  && (<NodeInputContainer
          nodeType="contact__form__card"

          title={{
            title: 'Middle Name ',
            required: true
          }}

          input={{
            type: 'text',
            ref: input => this.textInputName = input,
            autoFocus: true,
            value: this.state.middle_name,
            onChange: e => this.setState({
              ...this.state,
              middle_name: e.target.value
            }),
            onKeyPress: e => this.onKeyPress(e),
            placeholder: 'Middle Name',
            ariaLabel: null,
            ariaLive: 'polite'
          }}

          error={{
            message: this.state.middleNameError
          }}

          errorOn={
            this.state.middleNameError
          }
        />)}
        {this.nameActive() && this.lastNameActive()  && (<NodeInputContainer
          nodeType="contact__form__card"

          title={{
            title: 'Last Name ',
            required: true
          }}

          input={{
            type: 'text',
            ref: input => this.textInputName = input,
            autoFocus: true,
            value: this.state.last_name,
            onChange: e => this.setState({
              ...this.state,
              last_name: e.target.value
            }),
            onKeyPress: e => this.onKeyPress(e),
            placeholder: 'Last Name',
            ariaLabel: null,
            ariaLive: 'polite'
          }}

          error={{
            message: this.state.lastNameError
          }}

          errorOn={
            this.state.lastNameError
          }
        />)}
        {this.emailActive() && (<NodeInputContainer
          nodeType="contact__form__card"

          title={{
            title: 'Email ',
            required: true
          }}

          input={{
            type: 'text',
            ref: input => this.textInputEmail = input,
            autoFocus: !this.nameActive(),
            value: this.state.email,
            onChange: e => this.setState({
              ...this.state,
              email: e.target.value
            }),
            onKeyPress: e => this.onKeyPress(e),
            placeholder: 'sample@email.com',
            ariaLabel: null,
            ariaLive: 'polite'
          }}

          error={{
            message: this.state.emailError
          }}

          errorOn={this.state.emailError}
        />)}
        {this.phoneActive() && (<NodeInputContainer
          nodeType="contact__form__card"

          title={{
            title: 'Phone number ',
            required: true
          }}

          input={{
            type: 'text',
            autoFocus: !this.nameActive() && !this.phoneActive(),
            value: this.state.phone,
            onChange: e => this.setState({
              ...this.state,
              phone: e.target.value
            }),
            onKeyPress: e => this.onKeyPress(e),
            placeholder: '123-456-7890'
          }}

          error={{
            message: this.state.phoneError
          }}

          errorOn={this.state.phoneError}
        />)}
        <SubmitButton onClick={this.clickToSubmitContactInformation} />
      </div>
    );
  }
}

export const ContactFormCard = connect(
  (state: ChatState) => {
    return {
      // passed down to MessagePaneView
      locale:       state.format.locale,
      user: state.connection.user,
      conversationId: state.connection.botConnection.conversationId
    };
  }, {
    sendMessage
  }, (stateProps: any, dispatchProps: any, ownProps: any): ContactFormProps => {
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
)(ContactForm);
