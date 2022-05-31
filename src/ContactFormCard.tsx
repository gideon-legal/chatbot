import { Activity, CardAction, DirectLineOptions, Message} from 'botframework-directlinejs';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import * as moment from 'moment';
import * as React from 'react';
import { connect } from 'react-redux';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import { defaultStrings } from './Strings';

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
  updateInput: (disable: boolean, placeholder: string) => void;
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
      formattedMessage: ''
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.onChangeValue = this.onChangeValue.bind(this);
  }

  componentDidMount() {
    this.props.updateInput(
        true,
        'Please enter your contact information.'
    );
}

  private handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): any {
    if (e.key === 'Enter' && this.validateContactInformation()) {
        this.resetShell();
        this.props.sendMessage(this.getFormattedContact());
        document.removeEventListener('keypress', this.handleKeyDown.bind(this));
    }
  }

  resetShell = () => {
    this.props.updateInput(
      false,
      defaultStrings.consolePlaceholder
    );
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

    if (this.prefixActive() && !(this.state.prefix && this.state.prefix !== '')) {
      prefixError = 'Please select a prefix';
      validated = false;
    }

    if (this.nameActive() && !(this.state.name && this.state.name !== '')) {
      nameError = 'Please enter your name';
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

    this.setState({
      ...this.state,
      prefixError,
      nameError,
      emailError,
      phoneError
    });

    return validated;
  }

  getFormattedContact = () => {
    return JSON.stringify({
      ...this.state.email && { email: this.state.email },
        ...this.state.phone && { phone: this.state.phone },
        ...this.state.prefix && { prefix: this.state.prefix },
        ...this.state.name && { name: this.state.name }
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

  clickToSubmitContactInformation(e: React.MouseEvent<HTMLButtonElement>) {
    if (!this.validateContactInformation()) { return; }

    this.resetShell();
    this.props.sendMessage(this.getFormattedContact());

    document.removeEventListener('keypress', this.handleKeyDown.bind(this));

    e.stopPropagation();
  }

  private onKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && this.validateContactInformation()) {
        this.resetShell();
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
      <div className="contact__form__card">
        <label><b>Contact Information</b></label>
        {this.prefixActive() && (<div className="contact__form__card__container">
          <span className={'contact__form__card__container__title'}>Title</span>
          <div className="prefix__radio">
            <input
              type="radio"
              name="prefix"
              value="Mr."
              id="mr"
              onChange={this.onChangeValue}/>
            <label>Mr.</label>
            <input
              type="radio"
              name="prefix"
              value="Mrs."
              id="mrs"
              onChange={this.onChangeValue}/>
            <label>Mrs.</label>
            <input
              type="radio"
              name="prefix"
              value="Ms."
              id="ms"
              onChange={this.onChangeValue}/>
            <label>Ms.</label>
            <input
              type="radio"
              name="prefix"
              value="Mx."
              id="mx"
              onChange={this.onChangeValue}/>
            <label>Mx.</label>
            <input
              type="radio"
              name="prefix"
              value="Dr."
              id="dr"
              onChange={this.onChangeValue}/>
            <label>Dr.</label>
          </div>
          {this.state.prefixError && <span className="contact__form__card__container__error">{this.state.prefixError}</span>}
        </div>)}
        {this.nameActive() && (<div className="contact__form__card__container">
          <span className={'contact__form__card__container__title'}>Name</span>
          <input
              type="text"
              className={'contact__form__card__container__input'}
              ref={ input => this.textInputName = input }
              autoFocus={true}
              value={ this.state.name }
              onChange={ e => this.setState({
                ...this.state,
                name: e.target.value
              }) }
              onKeyPress={ e => this.onKeyPress(e) }
              // onFocus={ () => this.onTextInputFocus() }
              placeholder="First and Last Name"
              aria-label={null}
              aria-live="polite"
          />
          {this.state.nameError && <span className="contact__form__card__container__error">{this.state.nameError}</span>}
        </div>)}
        {this.emailActive() && (<div className="contact__form__card__container">
          <span className={'contact__form__card__container__title'}>Email</span>
          <input
              type="text"
              className={'contact__form__card__container__input'}
              ref={ input => this.textInputEmail = input }
              autoFocus={!this.nameActive()}
              value={ this.state.email }
              onChange={ e => this.setState({
                ...this.state,
                email: e.target.value
              }) }
              onKeyPress={ e => this.onKeyPress(e) }
              // onFocus={ () => this.onTextInputFocus() }
              placeholder="sample@email.com"
              aria-label={null}
              aria-live="polite"
          />
          {this.state.emailError && <span className="contact__form__card__container__error">{this.state.emailError}</span>}
        </div>)}
        {this.phoneActive() && (<div className="contact__form__card__container">
          <span className={'contact__form__card__container__title'}>Phone number</span>
          <input
              type="text"
              className={'contact__form__card__container__input'}
              autoFocus={!this.nameActive() && !this.phoneActive()}
              value={ this.state.phone }
              onChange={ e => this.setState({
                ...this.state,
                phone: e.target.value
              }) }
              onKeyPress={ e => this.onKeyPress(e) }
              // onFocus={ () => this.onTextInputFocus() }
              placeholder="123-456-7890"
          />
          {this.state.phoneError && <span className="contact__form__card__container__error">{this.state.phoneError}</span>}
        </div>)}
        <button type="button" className="contact__form__card__submit" onClick={e => this.clickToSubmitContactInformation(e) } title="Submit">
          Submit
        </button>
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
    updateInput: (disable: boolean, placeholder: string) =>
          ({
              type: 'Update_Input',
              placeholder,
              disable,
              source: 'text'
          } as ChatActions),
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
      conversationId: stateProps.conversationId,
      updateInput: dispatchProps.updateInput
    };
  }
)(ContactForm);
