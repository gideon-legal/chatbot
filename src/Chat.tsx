import * as React from 'react';
import { findDOMNode } from 'react-dom';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';

import { parseReferrer } from 'analytics-utils';

import { Activity, CardActionTypes, DirectLine, DirectLineOptions, IBotConnection, User } from 'botframework-directlinejs';
import { isMobile } from 'react-device-detect';
import { connect, Provider } from 'react-redux';
import { conversationHistory, mapMessagesToActivities, ping, step, verifyConversation, checkNeedBackButton } from './api/bot';
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
    showConsole?: boolean;
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
    back_visible: boolean;
    node_count: number;
    clicked: boolean;
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
        back_visible: false,
        orginalBodyClass: document.body.className,
        node_count: -1,
        clicked: false
    };

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

    private async handleIncomingActivity(activity: Activity) {
        const state = this.store.getState();
        const activityCopy: any = activity;
        this.toggleBackButton(false);
        switch (activity.type) {
            case 'message':
                // adding node count to check if first node, need to grey out back button
                const curr_node_count = this.checkNodeCount();
                if(activity.entities) {
                    this.store.dispatch<ChatActions>({type: 'Toggle_Input', showConsole: false});
                    this.store.dispatch<ChatActions>({type: 'Toggle_InputEnabled', inputEnabled: false});
                    if(activity.entities[0].node_type == 'prompt' || activity.entities[0].type == 'ClientCapabilities') {
                        this.toggleBackButton(false)
                    } else {
                        if( this.checkNodeCount() <= 0 ) {
                            this.toggleBackButton(false)
                        } else {
                            this.toggleBackButton(true)
                        }
                    }
                    if(activity.entities[0].node_type !== 'prompt' && activity.entities[0].type !== 'ClientCapabilities'){
                        this.addNodeCount();
                    }
               } else {
                const botConnection: any = this.store.getState().connection.botConnection;


                // if the current activity has no entities, it might be a completion node, in which case we must hide the back button
                // checkNeedBackButton returns if the current activity corresponds to a completion node or not
                const notNode =  await checkNeedBackButton(this.props.gid, this.props.directLine.secret,botConnection.conversationId, activity.text)   
                if(notNode !== "open" && !activity.text.includes("Sorry, but that's not a valid")){
                    this.toggleBackButton(false);
                    this.store.dispatch<ChatActions>({type: 'Toggle_Input', showConsole: false});
                    this.store.dispatch<ChatActions>({type: 'Toggle_InputEnabled', inputEnabled: false});
                } else {
                    // open response only
                    if( this.checkNodeCount() == 0 ) {
                        this.toggleBackButton(false)
                    } else {
                        this.toggleBackButton(true)
                    }
                    //this.toggleBackButton(true)
                    this.store.dispatch<ChatActions>({type: 'Toggle_Input', showConsole: true});
                    this.store.dispatch<ChatActions>({type: 'Toggle_InputEnabled', inputEnabled: true});
                }
                this.addNodeCount();
               }
                this.store.dispatch<ChatActions>({ type: activity.from.id === state.connection.user.id ? 'Receive_Sent_Message' : 'Receive_Message', activity });
                break;
                
            case 'typing':
                this.toggleBackButton(false)
                if (activity.from.id !== state.connection.user.id) {
                    this.store.dispatch<ChatActions>({ type: 'Show_Typing', activity });
                    this.store.dispatch<ChatActions>({type: 'Toggle_Input', showConsole: false});
                    this.store.dispatch<ChatActions>({type: 'Toggle_InputEnabled', inputEnabled: false});
                }
                break;
        }
    }


    private toggle = () => {
        this.setState({
            open: !this.state.open,
            opened: true,
            back_visible: !this.state.back_visible
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

    private toggleBackButton = (show: boolean) => {
        this.setState({
            back_visible: show
        })
    }

    private checkBackButton = () => {
        return this.state.back_visible;
    }

    private addNodeCount = () => {
        const new_count = this.state.node_count+1
        this.setState({
            node_count: new_count
        })
    }

    private deleteNodeCount = () => {
        const curr_node = this.checkNodeCount();
        if (curr_node > 0){
            const updated_count = curr_node - 2
            this.setState({
                node_count: updated_count
            })
            this.state.node_count = updated_count
            this.toggleBackButton(true);
        } 
        const updated_count = this.checkNodeCount()
        if (updated_count <= 0) {
            this.setState({
                node_count: 0
            })
            this.state.node_count = 0
            this.toggleBackButton(false);
        }
    }

    private checkNodeCount = () => {
        return this.state.node_count;
    }

    private clicked = (show: boolean) => {
        if (show == true){
            document.getElementById('btn3').style.pointerEvents = 'none';

        } else {
            document.getElementById('btn3').style.pointerEvents = 'auto';

        }
        this.setState({
            clicked: show
        })  
    }

    //step function perfoms going back to the previous message
    private step = (messageId?: string|null) => {
        const botConnection: any = this.store.getState().connection.botConnection;

        step(this.props.gid, botConnection.conversationId, this.props.directLine.secret, messageId)
        .then((res: any) => {
            conversationHistory(this.props.gid, this.props.directLine.secret, botConnection.conversationId, res.data.id)
            .then((res: any) => {
                const messages = res.data.messages.reverse();
                //console.log(messages)
                const message_activities = mapMessagesToActivities(messages, this.store.getState().connection.user.id)
                this.props.showConsole === false;
                this.store.dispatch<ChatActions>({type: 'Toggle_Input', showConsole: false});
                this.store.dispatch<ChatActions>({type: 'Toggle_InputEnabled', inputEnabled: false});

                this.store.dispatch<ChatActions>({
                    type: 'Set_Messages',
                    activities: message_activities
                });

                // reset shell input
                this.store.dispatch<ChatActions>(
                    { type: 'Submit_Date' } as ChatActions
                );


                // have to resend receive_message for input enabled nodes
                if(messages[messages.length-1].entities && messages[messages.length-1].entities.length === 0){
                    this.store.dispatch<ChatActions>({type: 'Toggle_Input', showConsole: true});
                    this.store.dispatch<ChatActions>({type: 'Toggle_InputEnabled', inputEnabled: true});
                    this.store.dispatch<ChatActions>(
                        { type: 'Receive_Message',
                          activity: message_activities[message_activities.length-1]}
                    )
                    }
                this.clicked(false);
            });
        }
        )
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

                    const campaign = parseReferrer(document.referrer, window.location.href.toLowerCase());

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

        const backButtonClassName = classList(
            'wc-back-button',
            this.checkBackButton() === false && 'wc-back-button__disabled'
        )

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
                                

                                { // if input is enabled show this && or if bot is talking

                                    <div id="btn3" className = {backButtonClassName}>
                                    { <label
                                        className="wcbackbutton" onClick={ () => {
                                            this.clicked(true);
                                            this.step();
                                            this.deleteNodeCount();
                                        }}>

                                        <label style={{cursor: 'pointer'}}>
                                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                <div style={{position: 'relative', top: '19px'}}>
                                                <svg width="64" height="16" viewBox="0 0 64 16" xmlns="http://www.w3.org/2000/svg">
                                                    <path fill = {(this.state.clicked ? '#979797' : '#3F6DE1' )}  d="M35.488 12.768C35.9307 12.768 36.312 12.7173 36.632 12.616C36.952 12.5147 37.2133 12.3733 37.416 12.192C37.624 12.0053 37.776 11.7867 37.872 11.536C37.968 11.28 38.016 11 38.016 10.696C38.016 10.104 37.8053 9.63733 37.384 9.296C36.9627 8.94933 36.3307 8.776 35.488 8.776H33.008V12.768H35.488ZM33.008 3.76V7.672H35.056C35.4933 7.672 35.872 7.624 36.192 7.528C36.5173 7.432 36.784 7.29867 36.992 7.128C37.2053 6.95733 37.3627 6.752 37.464 6.512C37.5653 6.26667 37.616 6 37.616 5.712C37.616 5.03467 37.4133 4.54133 37.008 4.232C36.6027 3.91733 35.9733 3.76 35.12 3.76H33.008ZM35.12 2.536C35.824 2.536 36.4293 2.60533 36.936 2.744C37.448 2.88267 37.8667 3.08 38.192 3.336C38.5227 3.592 38.7653 3.90667 38.92 4.28C39.0747 4.648 39.152 5.064 39.152 5.528C39.152 5.81067 39.1067 6.08267 39.016 6.344C38.9307 6.6 38.8 6.84 38.624 7.064C38.448 7.288 38.224 7.49067 37.952 7.672C37.6853 7.848 37.3707 7.992 37.008 8.104C37.8507 8.264 38.4827 8.56533 38.904 9.008C39.3307 9.44533 39.544 10.0213 39.544 10.736C39.544 11.2213 39.4533 11.664 39.272 12.064C39.096 12.464 38.8347 12.808 38.488 13.096C38.1467 13.384 37.7253 13.608 37.224 13.768C36.7227 13.9227 36.152 14 35.512 14H31.464V2.536H35.12ZM45.7388 10.352C45.0828 10.3733 44.5228 10.4267 44.0588 10.512C43.6001 10.592 43.2241 10.6987 42.9308 10.832C42.6428 10.9653 42.4321 11.1227 42.2988 11.304C42.1708 11.4853 42.1068 11.688 42.1068 11.912C42.1068 12.1253 42.1414 12.3093 42.2108 12.464C42.2801 12.6187 42.3734 12.7467 42.4908 12.848C42.6134 12.944 42.7548 13.016 42.9148 13.064C43.0801 13.1067 43.2561 13.128 43.4428 13.128C43.6934 13.128 43.9228 13.104 44.1308 13.056C44.3388 13.0027 44.5334 12.928 44.7148 12.832C44.9014 12.736 45.0774 12.6213 45.2428 12.488C45.4134 12.3547 45.5788 12.2027 45.7388 12.032V10.352ZM41.1388 7.04C41.5868 6.608 42.0694 6.28533 42.5868 6.072C43.1041 5.85867 43.6774 5.752 44.3068 5.752C44.7601 5.752 45.1628 5.82667 45.5148 5.976C45.8668 6.12533 46.1628 6.33333 46.4028 6.6C46.6428 6.86667 46.8241 7.18933 46.9468 7.568C47.0694 7.94667 47.1308 8.36267 47.1308 8.816V14H46.4988C46.3601 14 46.2534 13.9787 46.1788 13.936C46.1041 13.888 46.0454 13.7973 46.0028 13.664L45.8428 12.896C45.6294 13.0933 45.4214 13.2693 45.2188 13.424C45.0161 13.5733 44.8028 13.7013 44.5788 13.808C44.3548 13.9093 44.1148 13.9867 43.8588 14.04C43.6081 14.0987 43.3281 14.128 43.0188 14.128C42.7041 14.128 42.4081 14.0853 42.1308 14C41.8534 13.9093 41.6108 13.776 41.4028 13.6C41.2001 13.424 41.0374 13.2027 40.9148 12.936C40.7974 12.664 40.7388 12.344 40.7388 11.976C40.7388 11.656 40.8268 11.3493 41.0028 11.056C41.1788 10.7573 41.4641 10.4933 41.8588 10.264C42.2534 10.0347 42.7681 9.848 43.4028 9.704C44.0374 9.55467 44.8161 9.46933 45.7388 9.448V8.816C45.7388 8.18667 45.6028 7.712 45.3308 7.392C45.0588 7.06667 44.6614 6.904 44.1388 6.904C43.7868 6.904 43.4908 6.94933 43.2508 7.04C43.0161 7.12533 42.8108 7.224 42.6348 7.336C42.4641 7.44267 42.3148 7.54133 42.1868 7.632C42.0641 7.71733 41.9414 7.76 41.8188 7.76C41.7228 7.76 41.6401 7.736 41.5708 7.688C41.5014 7.63467 41.4428 7.57067 41.3947 7.496L41.1388 7.04ZM54.9399 7.336C54.8972 7.39467 54.8545 7.44 54.8119 7.472C54.7692 7.504 54.7105 7.52 54.6359 7.52C54.5559 7.52 54.4679 7.488 54.3719 7.424C54.2759 7.35467 54.1559 7.28 54.0119 7.2C53.8732 7.12 53.6999 7.048 53.4919 6.984C53.2892 6.91467 53.0385 6.88 52.7399 6.88C52.3399 6.88 51.9879 6.952 51.6839 7.096C51.3799 7.23467 51.1239 7.43733 50.9159 7.704C50.7132 7.97067 50.5585 8.29333 50.4519 8.672C50.3505 9.05067 50.2999 9.47467 50.2999 9.944C50.2999 10.4347 50.3559 10.872 50.4679 11.256C50.5799 11.6347 50.7372 11.9547 50.9399 12.216C51.1479 12.472 51.3959 12.6693 51.6839 12.808C51.9772 12.9413 52.3052 13.008 52.6679 13.008C53.0145 13.008 53.2999 12.968 53.5239 12.888C53.7479 12.8027 53.9319 12.7093 54.0759 12.608C54.2252 12.5067 54.3479 12.416 54.4439 12.336C54.5452 12.2507 54.6439 12.208 54.7399 12.208C54.8572 12.208 54.9479 12.2533 55.0119 12.344L55.4119 12.864C55.2359 13.0827 55.0359 13.2693 54.8119 13.424C54.5879 13.5787 54.3452 13.7093 54.0839 13.816C53.8279 13.9173 53.5585 13.992 53.2759 14.04C52.9932 14.088 52.7052 14.112 52.4119 14.112C51.9052 14.112 51.4332 14.0187 50.9959 13.832C50.5639 13.6453 50.1879 13.376 49.8679 13.024C49.5479 12.6667 49.2972 12.2293 49.1159 11.712C48.9345 11.1947 48.8439 10.6053 48.8439 9.944C48.8439 9.34133 48.9265 8.784 49.0919 8.272C49.2625 7.76 49.5079 7.32 49.8279 6.952C50.1532 6.57867 50.5505 6.288 51.0199 6.08C51.4945 5.872 52.0385 5.768 52.6519 5.768C53.2225 5.768 53.7239 5.86133 54.1559 6.048C54.5932 6.22933 54.9799 6.488 55.3159 6.824L54.9399 7.336ZM58.3725 2.216V9.152H58.7405C58.8472 9.152 58.9352 9.13867 59.0045 9.112C59.0792 9.08 59.1565 9.01867 59.2365 8.928L61.7965 6.184C61.8712 6.09333 61.9485 6.024 62.0285 5.976C62.1138 5.92267 62.2258 5.896 62.3645 5.896H63.6525L60.6685 9.072C60.5245 9.25333 60.3698 9.39467 60.2045 9.496C60.3005 9.56 60.3858 9.63467 60.4605 9.72C60.5405 9.8 60.6152 9.89333 60.6845 10L63.8525 14H62.5805C62.4578 14 62.3512 13.9813 62.2605 13.944C62.1752 13.9013 62.1005 13.8267 62.0365 13.72L59.3725 10.4C59.2925 10.288 59.2125 10.216 59.1325 10.184C59.0578 10.1467 58.9405 10.128 58.7805 10.128H58.3725V14H56.9405V2.216H58.3725Z" />
                                                    <path fill = {(this.state.clicked ? '#979797' : '#3F6DE1' )} d="M18.75 6.85796H3.925L8.4625 1.87555C8.67467 1.64218 8.77675 1.34131 8.74628 1.03914C8.7158 0.736965 8.55527 0.458234 8.3 0.264265C8.04473 0.070295 7.71563 -0.0230245 7.3851 0.00483557C7.05456 0.0326956 6.74967 0.179453 6.5375 0.412823L0.2875 7.26935C0.245451 7.32389 0.207849 7.38118 0.175 7.44076C0.175 7.4979 0.175 7.53218 0.0875002 7.58932C0.0308421 7.72035 0.0011764 7.85982 0 8.00071C0.0011764 8.1416 0.0308421 8.28108 0.0875002 8.4121C0.0875002 8.46924 0.0874998 8.50353 0.175 8.56066C0.207849 8.62025 0.245451 8.67754 0.2875 8.73208L6.5375 15.5886C6.65503 15.7176 6.8022 15.8213 6.96856 15.8924C7.13491 15.9635 7.31636 16.0003 7.5 16C7.79207 16.0005 8.07511 15.9075 8.3 15.7372C8.42657 15.6412 8.5312 15.5234 8.60789 15.3905C8.68458 15.2575 8.73183 15.112 8.74692 14.9623C8.76202 14.8127 8.74466 14.6617 8.69586 14.5182C8.64705 14.3747 8.56775 14.2414 8.4625 14.1259L3.925 9.14347H18.75C19.0815 9.14347 19.3995 9.02307 19.6339 8.80876C19.8683 8.59446 20 8.30379 20 8.00071C20 7.69764 19.8683 7.40697 19.6339 7.19266C19.3995 6.97836 19.0815 6.85796 18.75 6.85796Z" />
                                                </svg>
                                                </div>
                                            </div>
                                        </label>
                                    </label>}   
                                </div> }
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
