import * as React from 'react';
import { findDOMNode } from 'react-dom';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';

import { parseReferrer } from 'analytics-utils';

import { Activity, CardActionTypes, DirectLine, DirectLineOptions, IBotConnection, User } from 'botframework-directlinejs';
import { isMobile } from 'react-device-detect';
import { connect, Provider } from 'react-redux';
import { conversationHistory, mapMessagesToActivities, ping, step, verifyConversation } from './api/bot';
import { getTabIndex } from './getTabIndex';
import { guid } from './GUID';
import * as konsole from './Konsole';
import { Speech } from './SpeechModule';
import { SpeechOptions } from './SpeechOptions';
import { ChatActions, createStore, sendMessage } from './Store';
import { Strings } from './Strings';
import { ActivityOrID, FormatOptions } from './Types';

export interface ChatProps {
    adaptiveCardsHostConfig: any;
    chatTitle?: boolean | string;
    user: User;
    bot: User;
    activities: Activity[];
    strings: Strings;
    gid: string;
    botConnection?: IBotConnection;
    directLine?: DirectLineOptions;
    speechOptions?: SpeechOptions;
    locale?: string;
    selectedActivity?: BehaviorSubject<ActivityOrID>;
    sendTyping?: boolean;
    showUploadButton?: boolean;
    formatOptions?: FormatOptions;
    themeColor?: string;
    logoUrl?: string;
    fullscreenImageUrl?: string;
    resize?: 'none' | 'window' | 'detect';
}

export interface State {
    open: boolean;
    opened: boolean;
    display: boolean;
    orginalBodyClass: string;
    fullscreen: boolean;
    full_height: boolean;
}

import { FloatingIcon } from './FloatingIcon';
import { FullscreenStaticContent } from './FullscreenStaticContent';
import { History } from './History';
import { Shell, ShellFunctions } from './Shell';

export class Chat extends React.Component<ChatProps, State> {

    state = {
        open: false,
        opened: false,
        display: false,
        fullscreen: false,
        full_height: false,
        orginalBodyClass: document.body.className
    };

    private clicked: any; // status of if the back button has been clicked already

    private store = createStore();

    private botConnection: IBotConnection;

    private activitySubscription: Subscription;
    private connectionStatusSubscription: Subscription;
    private selectedActivitySubscription: Subscription;
    private shellRef: React.Component & ShellFunctions;
    private historyRef: React.Component;
    private chatviewPanelRef: HTMLElement;

    private resizeListener = () => this.setSize();

    // tslint:disable:variable-name
    private _handleCardAction = this.handleCardAction.bind(this);
    private _handleKeyDownCapture = this.handleKeyDownCapture.bind(this);
    private _saveChatviewPanelRef = this.saveChatviewPanelRef.bind(this);
    private _saveHistoryRef = this.saveHistoryRef.bind(this);
    private _saveShellRef = this.saveShellRef.bind(this);
    // tslint:enable:variable-name

    constructor(props: ChatProps) {
        super(props);
        //this.clicked = {disabled: false};

        this.store.dispatch<ChatActions>({
            type: 'Set_Locale',
            locale: props.locale || (window.navigator as any).userLanguage || window.navigator.language || 'en'
        });

        if (props.adaptiveCardsHostConfig) {
            this.store.dispatch<ChatActions>({
                type: 'Set_AdaptiveCardsHostConfig',
                payload: props.adaptiveCardsHostConfig
            });
        }

        let { chatTitle } = props;

        if (props.formatOptions) {
            console.warn('DEPRECATED: "formatOptions.showHeader" is deprecated, use "chatTitle" instead. See https://github.com/Microsoft/BotFramework-WebChat/blob/master/CHANGELOG.md#formatoptionsshowheader-is-deprecated-use-chattitle-instead.');

            if (typeof props.formatOptions.showHeader !== 'undefined' && typeof props.chatTitle === 'undefined') {
                chatTitle = props.formatOptions.showHeader;
            }

            if (props.formatOptions) {
                this.store.dispatch<ChatActions>({
                    type: 'Set_Format_Options',
                    formatOptions: props.formatOptions
                });
            }
        }

        if (typeof chatTitle !== 'undefined') {
            this.store.dispatch<ChatActions>({ type: 'Set_Chat_Title', chatTitle });
        }

        this.store.dispatch<ChatActions>({ type: 'Toggle_Upload_Button', showUploadButton: props.showUploadButton !== false });

        if (props.sendTyping) {
            this.store.dispatch<ChatActions>({ type: 'Set_Send_Typing', sendTyping: props.sendTyping });
        }

        if (props.speechOptions) {
            Speech.SpeechRecognizer.setSpeechRecognizer(props.speechOptions.speechRecognizer);
            Speech.SpeechSynthesizer.setSpeechSynthesizer(props.speechOptions.speechSynthesizer);
        }
    }

    private handleIncomingActivity(activity: Activity) {
        const state = this.store.getState();
        const activityCopy: any = activity;

        switch (activity.type) {
            case 'message':
                this.store.dispatch<ChatActions>({ type: activity.from.id === state.connection.user.id ? 'Receive_Sent_Message' : 'Receive_Message', activity });
                break;

            case 'typing':
                if (activity.from.id !== state.connection.user.id) {
                    this.store.dispatch<ChatActions>({ type: 'Show_Typing', activity });
                }
                break;
        }
    }

    private toggle = () => {
        this.setState({
            open: !this.state.open,
            opened: true
        });
    }

    // Gets initially called if open_fullscreen botParam is set to true
    private toggleFullscreen = () => {
        this.setState({
            fullscreen: !this.state.fullscreen
        });
    }

    private toggleFullHeight = () => {
        this.setState({
            full_height: !this.state.full_height
        });
    }

    private step = (messageId?: string|null) => {
        const botConnection: any = this.store.getState().connection.botConnection;
        step(this.props.gid, botConnection.conversationId, this.props.directLine.secret, messageId)
        .then((res: any) => {
            conversationHistory(this.props.gid, this.props.directLine.secret, botConnection.conversationId, res.data.id)
            .then((res: any) => {
                const messages = res.data.messages.reverse();
                this.store.dispatch<ChatActions>({
                    type: 'Set_Messages',
                    activities: mapMessagesToActivities(messages, this.store.getState().connection.user.id)
                });

                // reset shell input
                this.store.dispatch<ChatActions>(
                    { type: 'Submit_Date' } as ChatActions
                );
            });
        })
        .catch((err: any) => {
            console.log(err);
        });
    }

    private setSize() {
        this.store.dispatch<ChatActions>({
            type: 'Set_Size',
            width: this.chatviewPanelRef.offsetWidth,
            height: this.chatviewPanelRef.offsetHeight
        });
    }

    private handleCardAction() {
        // After the user click on any card action, we will "blur" the focus, by setting focus on message pane
        // This is for after click on card action, the user press "A", it should go into the chat box
        const historyDOM = findDOMNode(this.historyRef) as HTMLElement;

        if (historyDOM) {
            historyDOM.focus();
        }
    }

    private handleKeyDownCapture(evt: React.KeyboardEvent<HTMLDivElement>) {
        const target = evt.target as HTMLElement;
        const tabIndex = getTabIndex(target);

        if (
            evt.altKey
            || evt.ctrlKey
            || evt.metaKey
            || (!inputtableKey(evt.key) && evt.key !== 'Backspace')
        ) {
            // Ignore if one of the utility key (except SHIFT) is pressed
            // E.g. CTRL-C on a link in one of the message should not jump to chat box
            // E.g. "A" or "Backspace" should jump to chat box
            return;
        }

        if (
            target === findDOMNode(this.historyRef)
            || typeof tabIndex !== 'number'
            || tabIndex < 0
        ) {
            evt.stopPropagation();

            let key: string;

            // uirks: onKeyDown we re-focus, but the newly focused element does not receive the subsequent onKeyPress event
            //         It is working in Chrome/Firefox/IE, confirmed not working in Edge/16
            //         So we are manually appending the key if they can be inputted in the box
            if (/(^|\s)Edge\/16\./.test(navigator.userAgent)) {
                key = inputtableKey(evt.key);
            }

            this.shellRef.focus(key);
        }
    }

    private saveChatviewPanelRef(chatviewPanelRef: HTMLElement) {
        this.chatviewPanelRef = chatviewPanelRef;
    }

    private saveHistoryRef(historyWrapper: any) {
        this.historyRef = historyWrapper && historyWrapper.getWrappedInstance();
    }

    private saveShellRef(shellWrapper: any) {
        this.shellRef = shellWrapper && shellWrapper.getWrappedInstance();
    }

    componentDidMount() {
        // Now that we're mounted, we know our dimensions. Put them in the store (this will force a re-render)
        this.setSize();
        const msftUserId = window.localStorage.getItem('msft_user_id');

        const isNew = true;
        let botConnection: any = null;

        botConnection = this.props.directLine ?
            (this.botConnection = new DirectLine(this.props.directLine)) :
            this.props.botConnection;

        if (this.props.resize === 'window') {
            window.addEventListener('resize', this.resizeListener);
        }

        let user = this.props.user;

        // Generate random user ID if there is none
        if (!user && !msftUserId) {
            user = {
                id: guid()
            };
        } else if (msftUserId) {
            user = {
                id: msftUserId
            };
        }

        this.store.dispatch<ChatActions>({
            type: 'Start_Connection',
            user,
            bot: this.props.bot,
            botConnection,
            selectedActivity: this.props.selectedActivity
        });

        const state = this.store.getState();

        this.connectionStatusSubscription = botConnection.connectionStatus$.subscribe((connectionStatus: any) => {
            if (connectionStatus === 2) {  // wait for connection is 'OnLine' to send data to bot

                const botCopy: any = botConnection;
                const conversationId = botCopy.conversationId;

                if (!state.connection.verification.attempted) {
                    this.store.dispatch<ChatActions>({
                        type: 'Set_Verification',
                        verification: {
                            attempted: true
                        }
                    });

                    const campaign = parseReferrer(document.referrer, window.location.href);

                    verifyConversation(
                        this.props.gid,
                        conversationId,
                        user.id,
                        this.props.directLine.secret,
                        window.location.toString(),
                        campaign
                    )
                    .then((res: any) => {
                        // Only save these when we successfully connect
                        // uncomment when re-enabling chat history
                        window.localStorage.setItem('msft_conversation_id', conversationId);
                        window.localStorage.setItem('gid', this.props.gid);
                        window.localStorage.setItem('msft_user_id', user.id);

                        this.setState({
                            display: true
                        });

                        const { bot_display_options } = res.data;

                        if (bot_display_options && bot_display_options.display_title) {
                            this.store.dispatch<ChatActions>({
                                type: 'Set_Chat_Title',
                                chatTitle: bot_display_options.display_title
                            });
                        }

                        if (bot_display_options && bot_display_options.color) {
                            this.store.dispatch<ChatActions>({
                                type: 'Set_Theme_Color',
                                themeColor: bot_display_options.color
                            });
                        }

                        if (bot_display_options) {
                            const { alignment, bottomOffset, topOffset, leftOffset, rightOffset, full_height, display_name, widget_url, widget_same_as_logo, open_fullscreen  } = bot_display_options;

                            this.store.dispatch({
                                type: 'Set_Format_Options',
                                formatOptions: {
                                    alignment,
                                    bottomOffset,
                                    topOffset,
                                    leftOffset,
                                    rightOffset,
                                    display_name,
                                    widgetSameAsLogo: widget_same_as_logo,
                                    widgetUrl: widget_url,
                                    fullscreen: open_fullscreen || false,
                                    full_height: full_height || false
                                }
                            });
                        }

                        if (bot_display_options && bot_display_options.logo_url) {
                            this.store.dispatch<ChatActions>({
                                type: 'Set_Logo_Img',
                                logoUrl: bot_display_options.logo_url
                            });
                        }

                        if (!isMobile && bot_display_options && bot_display_options.open_on_load) {
                            this.toggle();
                        }

                        if (bot_display_options && bot_display_options.open_fullscreen) {
                            if (bot_display_options.fullscreen_url) {
                                this.store.dispatch<ChatActions>({
                                    type: 'Set_Fullscreen_Img',
                                    fullscreenImageUrl: bot_display_options.fullscreen_url
                                });
                            }
                            this.toggleFullscreen();
                        }

                        if (bot_display_options && bot_display_options.full_height) {
                            this.toggleFullHeight();
                        }

                        this.store.dispatch<ChatActions>({
                            type: 'Set_Verification',
                            verification: {
                                status: 1
                            }
                        });

                        conversationHistory(this.props.gid, this.props.directLine.secret, conversationId)
                        .then((res: any) => {
                            const state = this.store.getState();
                            const messages = res.data.messages.reverse();

                            this.store.dispatch<ChatActions>({
                                type: 'Set_Messages',
                                activities: mapMessagesToActivities(messages, state.connection.user.id)
                            });
                        });

                        // Ping server with activity every 30 seconds
                        setInterval(() => {
                            ping(
                                this.props.gid,
                                conversationId,
                                this.props.directLine.secret
                            );
                        }, 10000);

                        // Only initialize convo for user if it's their first time
                        // interacting with the chatbot
                        if (isNew) {
                            // Send initial message to start conversation
                            this.store.dispatch(sendMessage(state.format.strings.pingMessage, state.connection.user, state.format.locale));
                        }
                    })
                    .catch((err: any) => {
                        this.store.dispatch<ChatActions>({
                            type: 'Set_Verification',
                            verification: {
                                status: 2
                            }
                        });
                    });
                }
            }

            if (this.props.speechOptions && this.props.speechOptions.speechRecognizer) {
                const refGrammarId = botConnection.referenceGrammarId;
                if (refGrammarId) {
                    this.props.speechOptions.speechRecognizer.referenceGrammarId = refGrammarId;
                }
            }

            this.store.dispatch<ChatActions>({ type: 'Connection_Change', connectionStatus });
        });

        this.activitySubscription = botConnection.activity$.subscribe(
            (activity: Activity) => this.handleIncomingActivity(activity),
            (error: Error) => konsole.log('activity$ error', error)
        );

        if (this.props.selectedActivity) {
            this.selectedActivitySubscription = this.props.selectedActivity.subscribe(activityOrID => {
                this.store.dispatch<ChatActions>({
                    type: 'Select_Activity',
                    selectedActivity: activityOrID.activity || this.store.getState().history.activities.find(activity => activity.id === activityOrID.id)
                });
            });
        }
    }

    componentWillUnmount() {
        this.connectionStatusSubscription.unsubscribe();
        this.activitySubscription.unsubscribe();
        if (this.selectedActivitySubscription) {
            this.selectedActivitySubscription.unsubscribe();
        }
        if (this.botConnection) {
            this.botConnection.end();
        }
        window.removeEventListener('resize', this.resizeListener);
    }

    componentWillReceiveProps(nextProps: ChatProps) {
        if (this.props.adaptiveCardsHostConfig !== nextProps.adaptiveCardsHostConfig) {
            this.store.dispatch<ChatActions>({
                type: 'Set_AdaptiveCardsHostConfig',
                payload: nextProps.adaptiveCardsHostConfig
            });
        }

        if (this.props.showUploadButton !== nextProps.showUploadButton) {
            this.store.dispatch<ChatActions>({
                type: 'Toggle_Upload_Button',
                showUploadButton: nextProps.showUploadButton
            });
        }

        if (this.props.chatTitle !== nextProps.chatTitle) {
            this.store.dispatch<ChatActions>({
                type: 'Set_Chat_Title',
                chatTitle: nextProps.chatTitle
            });
        }
    }

    private calculateChatviewPanelStyle = (format: FormatOptions) => {
        const alignment = format && format.alignment;
        const fullHeight = format && format.full_height;
        const fullscreen = format && format.fullscreen;

        if (fullscreen) {
            return {
                left: 0,
                right: 0,
                bottom: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                borderRadius: 0
            };
        }

        const bottomOffset = fullHeight ? 0 : (format && format.bottomOffset ? format.bottomOffset + 99 : 17);
        const topOffset = format && format.topOffset ? format.topOffset : 0;
        const rightOffset = fullHeight ? 0 : (alignment !== 'left' && format && format.rightOffset ? format.rightOffset : -1);
        const height = fullHeight ? '100vh' : '80%';

        let styles = {
            bottom: bottomOffset,
            height,
            ...(rightOffset !== -1 || (format && format.full_height)) && { right: rightOffset }
        };

        if (alignment && alignment === 'left') {
            const leftOffsetVal = fullHeight || isMobile ? 0 : (format.leftOffset || 17);
            styles = {
                ...styles,
                ...{ left: leftOffsetVal }
            };
        }

        return styles;
    }

    // At startup we do three render passes:
    // 1. To determine the dimensions of the chat panel (nothing needs to actually render here, so we don't)
    // 2. To determine the margins of any given carousel (we just render one mock activity so that we can measure it)
    // 3. (this is also the normal re-render case) To render without the mock activity

    render() {
        const state = this.store.getState();

        const { open, opened, display, fullscreen } = this.state;

        const chatviewPanelStyle = this.calculateChatviewPanelStyle(state.format);

        // only render real stuff after we know our dimensions
        return (
            <Provider store={ this.store }>
                <div>
                <div
                    className={`wc-wrap ${display ? '' : 'hide'}`}
                    style={{ display: 'none'}}
                >
                    <FloatingIcon
                        visible={!open}
                        clicked={() => this.toggle()}
                    />

                    <div
                        className={`wc-chatview-panel ${open ? 'wc-chatview-panel__open' : 'wc-chatview-panel__closed' }`}
                        onKeyDownCapture={ this._handleKeyDownCapture }
                        ref={ this._saveChatviewPanelRef }
                        style={chatviewPanelStyle}
                    >
                        {
                            !!state.format.chatTitle &&
                                <div className={!fullscreen ? 'wc-header' : 'wc-header wc-header-fullscreen'} style={{backgroundColor: state.format.themeColor}}>
                                    <img
                                        className="wc-header--logo"
                                        src={state.format.logoUrl ?
                                            state.format.logoUrl :
                                            'https://s3.amazonaws.com/com.gideon.static.dev/chatbot-header-default-v1.1.2.png'
                                        }
                                      />

                                  <span>{typeof state.format.chatTitle === 'string' ? state.format.chatTitle : 'Gideon' }</span>
                                    {/* Close X image on chat */}
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={() => {this.toggle(); }} >
                                        <title>wc-header--close</title>
                                        <path className="wc-header--close" d="M18 2L2 18" stroke="#FCFCFC" stroke-width="3" stroke-linecap="round" />
                                        <path className="wc-header--close" d="M2 2L18 18" stroke="#FCFCFC" stroke-width="3" stroke-linecap="round" />
                                    </svg>
                                    {/* <img
                                        className="wc-header--close"
                                        onClick={() => {this.toggle(); }}
                                        src="https://s3.amazonaws.com/com.gideon.static.dev/chatbot/close.svg" /> */}

                                    {/* {{ <img
                                        className="wc-header--back" onClick={() => {
                                            if (!this.clicked.disabled) {
                                            this.step(); this.clicked.disabled = true; }// disable click action after first click
                                    }}
                                    src="https://s3.amazonaws.com/com.gideon.static.dev/chatbot/back.svg" />  } */} 
                                </div>
                        }

                        <div className="wc-chatbot-content">
                            {fullscreen && <div className="wc-chatbot-content-left">
                                {/* TODO - Put content to display on left side of fullscreen */}
                                <FullscreenStaticContent
                                    imageUrl={state.format.fullscreenImageUrl ?
                                                state.format.fullscreenImageUrl :
                                                null}
                                />
                            </div>}

                            <div className="wc-chatbot-content-right">
                                <History
                                    onCardAction={ this._handleCardAction }
                                    ref={ this._saveHistoryRef }
                                    gid={ this.props.gid }
                                    directLine={ this.props.directLine }
                                />

                                <Shell ref={ this._saveShellRef } />

                                    <div className="wc-footer">
                                    <div className='wc-back-button'> 
                    { <label
                        className="wc-backbutton" onClick={() => {
                            if (!this.clicked) {
                            this.step(); this.clicked = true; // disable click action after first click 
                        }
                        }}>

                        <label>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <div style={{position: 'relative', top: '19px', left: '44px', color: '#3F6DE1' }}>
                                Back
                                <div style = {{position: 'absolute', left: '-30px', top:'0', color: '#3F6DE1'}}>
                                    <svg width="20" height="16" viewBox="0 0 20 16" fill={(this.clicked ? '#979797' : '#3F6DE1' )} xmlns="http://www.w3.org/2000/svg">
                                        <path fill={(this.clicked ? '#979797' : '#3F6DE1' )} d="M18.75 6.85796H3.925L8.4625 1.87555C8.67467 1.64218 8.77675 1.34131 8.74628 1.03914C8.7158 0.736965 8.55527 0.458234 8.3 0.264265C8.04473 0.070295 7.71563 -0.0230245 7.3851 0.00483557C7.05456 0.0326956 6.74967 0.179453 6.5375 0.412823L0.2875 7.26935C0.245451 7.32389 0.207849 7.38118 0.175 7.44076C0.175 7.4979 0.175 7.53218 0.0875002 7.58932C0.0308421 7.72035 0.0011764 7.85982 0 8.00071C0.0011764 8.1416 0.0308421 8.28108 0.0875002 8.4121C0.0875002 8.46924 0.0874998 8.50353 0.175 8.56066C0.207849 8.62025 0.245451 8.67754 0.2875 8.73208L6.5375 15.5886C6.65503 15.7176 6.8022 15.8213 6.96856 15.8924C7.13491 15.9635 7.31636 16.0003 7.5 16C7.79207 16.0005 8.07511 15.9075 8.3 15.7372C8.42657 15.6412 8.5312 15.5234 8.60789 15.3905C8.68458 15.2575 8.73183 15.112 8.74692 14.9623C8.76202 14.8127 8.74466 14.6617 8.69586 14.5182C8.64705 14.3747 8.56775 14.2414 8.4625 14.1259L3.925 9.14347H18.75C19.0815 9.14347 19.3995 9.02307 19.6339 8.80876C19.8683 8.59446 20 8.30379 20 8.00071C20 7.69764 19.8683 7.40697 19.6339 7.19266C19.3995 6.97836 19.0815 6.85796 18.75 6.85796Z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        </label>
                    </label>}   
                </div>  
                                        {/* TODO - temporarily commented out for all users to accomodate a new client */}
                                        {/* <a href="https://gideon.legal">
                                        <span>Powered by</span>
                                        <img
                                            className="wc-footer--logo"
                                            src="https://s3.amazonaws.com/com.gideon.static.dev/logotype-v1.1.0.svg"
                                            />
                                        </a> */}

                            
                                    </div>
                                {
                                    this.props.resize === 'detect' &&
                                        <ResizeDetector onresize={ this.resizeListener } />
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <div className='wc-back-button'> 
                    { <label
                        className="wc-backbutton" onClick={() => {
                            if (!this.clicked) {
                            this.step(); this.clicked = true; // disable click action after first click 
                        }
                        }}>

                        <label>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <div style={{position: 'relative', top: '19px', left: '44px', color: '#3F6DE1' }}>
                                Back
                                <div style = {{position: 'absolute', left: '-30px', top:'0', color: '#3F6DE1'}}>
                                    <svg width="20" height="16" viewBox="0 0 20 16" fill={(this.clicked ? '#979797' : '#3F6DE1' )} xmlns="http://www.w3.org/2000/svg">
                                        <path fill={(this.clicked ? '#979797' : '#3F6DE1' )} d="M18.75 6.85796H3.925L8.4625 1.87555C8.67467 1.64218 8.77675 1.34131 8.74628 1.03914C8.7158 0.736965 8.55527 0.458234 8.3 0.264265C8.04473 0.070295 7.71563 -0.0230245 7.3851 0.00483557C7.05456 0.0326956 6.74967 0.179453 6.5375 0.412823L0.2875 7.26935C0.245451 7.32389 0.207849 7.38118 0.175 7.44076C0.175 7.4979 0.175 7.53218 0.0875002 7.58932C0.0308421 7.72035 0.0011764 7.85982 0 8.00071C0.0011764 8.1416 0.0308421 8.28108 0.0875002 8.4121C0.0875002 8.46924 0.0874998 8.50353 0.175 8.56066C0.207849 8.62025 0.245451 8.67754 0.2875 8.73208L6.5375 15.5886C6.65503 15.7176 6.8022 15.8213 6.96856 15.8924C7.13491 15.9635 7.31636 16.0003 7.5 16C7.79207 16.0005 8.07511 15.9075 8.3 15.7372C8.42657 15.6412 8.5312 15.5234 8.60789 15.3905C8.68458 15.2575 8.73183 15.112 8.74692 14.9623C8.76202 14.8127 8.74466 14.6617 8.69586 14.5182C8.64705 14.3747 8.56775 14.2414 8.4625 14.1259L3.925 9.14347H18.75C19.0815 9.14347 19.3995 9.02307 19.6339 8.80876C19.8683 8.59446 20 8.30379 20 8.00071C20 7.69764 19.8683 7.40697 19.6339 7.19266C19.3995 6.97836 19.0815 6.85796 18.75 6.85796Z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        </label>
                    </label>}   
                </div>                 
            </div>
            </Provider >
        );
    }
}

export type IDoCardAction = (type: CardActionTypes, value: string | object) => void;

export const doCardAction = (
    botConnection: IBotConnection,
    from: User,
    locale: string,
    sendMessage: (value: string, user: User, locale: string) => void
): IDoCardAction => (
    type,
    actionValue
) => {

    const text = (typeof actionValue === 'string') ? actionValue as string : undefined;
    const value = (typeof actionValue === 'object') ? actionValue as object : undefined;

    switch (type) {
        case 'imBack':
            if (typeof text === 'string') {
                sendMessage(text, from, locale);
            }
            break;

        case 'postBack':
            sendPostBack(botConnection, text, value, from, locale);
            break;

        case 'call':
        case 'openUrl':
        case 'playAudio':
        case 'playVideo':
        case 'showImage':
        case 'downloadFile':
            window.open(text);
            break;
        case 'signin':
            const loginWindow = window.open();
            if (botConnection.getSessionId)  {
                botConnection.getSessionId().subscribe(sessionId => {
                    konsole.log('received sessionId: ' + sessionId);
                    loginWindow.location.href = text + encodeURIComponent('&code_challenge=' + sessionId);
                }, error => {
                    konsole.log('failed to get sessionId', error);
                });
            } else {
                loginWindow.location.href = text;
            }
            break;

        default:
            konsole.log('unknown button type', type);
        }
};

export const sendPostBack = (botConnection: IBotConnection, text: string, value: object, from: User, locale: string) => {
    botConnection.postActivity({
        type: 'message',
        text,
        value,
        from,
        locale
    })
    .subscribe(
        id => konsole.log('success sending postBack', id),
        error => konsole.log('failed to send postBack', error)
    );
};

export const renderIfNonempty = (value: any, renderer: (value: any) => JSX.Element ) => {
    if                                                      (value !== undefined && value !== null && (typeof value !== 'string' || value.length > 0)) {
        return renderer(value);
    }
};

export const classList = (...args: Array<string | boolean>) => {
    return args.filter(Boolean).join(' ');
};

// note: container of this element must have CSS position of either absolute or relative
const ResizeDetector = (props: {
    onresize: () => void
}) =>
    // adapted to React from https://github.com/developit/simple-element-resize-detector
    <iframe
        style={{
            border: 'none',
            height: '100%',
            left: 0,
            margin: '1px 0 0',
            opacity: 0,
            pointerEvents: 'none',
            position: 'absolute',
            top: '-100%',
            visibility: 'hidden',
            width: '100%'
        }}
        ref={ frame => {
            if (frame) {
                frame.contentWindow.onresize = props.onresize;
            }
        } }
    />;

// For auto-focus in some browsers, we synthetically insert keys into the chatbox.
// By default, we insert keys when:
// 1. evt.key.length === 1 (e.g. "1", "A", "=" keys), or
// 2. evt.key is one of the map keys below (e.g. "Add" will insert "+", "Decimal" will insert ".")
const INPUTTABLE_KEY: { [key: string]: string } = {
    Add:                                                      '+',      // Numpad add key
    Decimal: '.',  // Numpad decimal key
    Divide: '/',   // Numpad divide key
    Multiply: '*', // Numpad multiply key
    Subtract: '-'  // Numpad subtract key
};

function inputtableKey(key: string) {
    return key.length === 1 ? key : INPUTTABLE_KEY[key];
}
