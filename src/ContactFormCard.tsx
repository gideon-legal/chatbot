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
        <div className="contact_label"><b>Contact Information</b></div>
        {this.prefixActive() && (<div className="contact__form__card__container">
          <span className={'contact__form__card__container__title'}>Title</span>
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
          {this.state.prefixError && <span className="contact__form__card__container__error">{this.state.prefixError}</span>}
        </div>)}
        {this.nameActive() && (<div className="contact__form__card__container">
          <span className={'contact__form__card__container__title'}>Name <span className="required">*</span></span>
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
          <span className={'contact__form__card__container__title'}>Email <span className="required">*</span></span>
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
          <span className={'contact__form__card__container__title'}>Phone number <span className="required">*</span></span>
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
        <button type="button" className="contact__form__card__submit" onClick={e => this.clickToSubmitContactInformation(e) } title="Submit" style={{padding: '0% 32%'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>Submit</div>

            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path opacity="0.88" d="M0.992448 15.9999C0.837814 15.9986 0.68479 15.9614 0.546824 15.8911C0.408857 15.8208 0.288907 15.7193 0.196344 15.5946C0.103991 15.4701 0.042695 15.3256 0.0157638 15.1727C-0.0111673 15.0197 -0.00226317 14.8626 0.041977 14.7138L1.77399 8.67008C1.83662 8.68866 1.9019 8.69811 1.96719 8.69812H6.73217C6.91673 8.69812 7.09388 8.62431 7.22439 8.49292C7.3549 8.36152 7.42827 8.18328 7.42827 7.99746C7.42827 7.81163 7.3549 7.63346 7.22439 7.50206C7.09388 7.37066 6.91673 7.29685 6.73217 7.29685H1.96719C1.90191 7.29704 1.83665 7.30643 1.77399 7.32483L0.041977 1.28123C-0.00213433 1.13328 -0.0119688 0.976971 0.014793 0.824867C0.0415547 0.672763 0.103468 0.529099 0.195373 0.405408C0.287454 0.280174 0.407778 0.178327 0.545853 0.10795C0.683928 0.037573 0.836718 0.000581323 0.991477 0C1.13893 0.00118104 1.28401 0.0354079 1.41671 0.10013L16.4281 7.09763C16.6002 7.17898 16.7462 7.30832 16.8475 7.47029C16.9489 7.63227 17.0015 7.8201 17 8.01151C17.0011 8.20116 16.948 8.3871 16.8466 8.54692C16.7452 8.70674 16.5995 8.8336 16.4281 8.91231L1.41671 15.9099C1.28352 15.971 1.13881 16.0017 0.992448 15.9999Z" fill="#FEFEFE"/>
            </svg>

          </div>
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
