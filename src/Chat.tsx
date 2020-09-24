import * as React from 'react';
import { findDOMNode } from 'react-dom';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';

import { parseReferrer } from 'analytics-utils';

import { Activity, CardActionTypes, DirectLineOptions, IBotConnection, User } from 'botframework-directlinejs';
import { isMobile } from 'react-device-detect';
import { Provider } from 'react-redux';
import { conversationHistory, getPastConversations, mapMessagesToActivities, step, verifyUserConnection } from './api/bot';
import { getTabIndex } from './getTabIndex';
import { guid } from './GUID';
import * as konsole from './Konsole';
import { Speech } from './SpeechModule';
import { SpeechOptions } from './SpeechOptions';
import { ChatActions, Conversation, createStore } from './Store';
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
    resize?: 'none' | 'window' | 'detect';
}

export interface State {
    open: boolean;
    opened: boolean;
    display: boolean;
    orginalBodyClass: string;
    isNew: boolean;
}

import { FloatingIcon } from './FloatingIcon';
import { History } from './History';
import { PastConversations } from './PastConversations';
import { Shell, ShellFunctions } from './Shell';

export class Chat extends React.Component<ChatProps, State> {

    state = {
        open: false,
        opened: false,
        display: false,
        orginalBodyClass: document.body.className,
        isNew: false
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
            type: 'Set_Verification',
            verification: {
                attempted: true
            },
            user
        });
        const campaign = parseReferrer(document.referrer, window.location.href);
        getPastConversations(this.props.gid, user.id, this.props.directLine.secret)
            .then(({data: { conversations }}: any) => {
                const formattedConversations =
                    conversations.map((conversation: Conversation) => {
                        return {
                            ...conversation,
                            conversation_messages: conversation.conversation_messages.reverse()
                        };
                    }).reverse();
                this.store.dispatch<ChatActions>({
                    type: 'Set_Conversations',
                    conversations: formattedConversations
                });
            });

        verifyUserConnection(
            this.props.gid,
            user.id,
            this.props.directLine.secret,
            window.location.toString(),
            campaign
        )
            .then((res: any) => {
                // Only save these when we successfully connect
                // uncomment when re-enabling chat history
                window.localStorage.setItem('gid', this.props.gid);
                window.localStorage.setItem('msft_user_id', user.id);

                this.setState({
                    display: true
                });

                const { bot_display_options, bot_id, organization_id } = res.data;

                this.store.dispatch<ChatActions>({
                    type: 'Set_Conversation_Ids',
                    botId: bot_id,
                    organizationId: organization_id
                });

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
                    const { alignment, bottomOffset, topOffset, leftOffset, rightOffset, fullHeight, display_name, widget_url, widget_same_as_logo  } = bot_display_options;

                    this.store.dispatch({
                        type: 'Set_Format_Options',
                        formatOptions: {
                            alignment,
                            bottomOffset,
                            topOffset,
                            leftOffset,
                            rightOffset,
                            fullHeight,
                            display_name,
                            widgetSameAsLogo: widget_same_as_logo,
                            widgetUrl: widget_url
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

            });
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

    newConversationClick = () => {
        this.setState({ isNew: true });
        this.forceUpdate();
    }

    private calculateChatviewPanelStyle = (format: FormatOptions) => {
        const alignment = format && format.alignment;
        const fullHeight = format && format.fullHeight;
        const bottomOffset = fullHeight ? 0 : (format && format.bottomOffset ? format.bottomOffset + 99 : 17);
        const topOffset = format && format.topOffset ? format.topOffset : 0;
        const rightOffset = fullHeight ? 0 : (alignment !== 'left' && format && format.rightOffset ? format.rightOffset : -1);
        const height = fullHeight ? '100vh' : `calc(100vh - ${bottomOffset}px - ${topOffset}px - 20px)`;

        let styles = {
            bottom: bottomOffset,
            height,
            ...(rightOffset !== -1 || (format && format.fullHeight)) && { right: rightOffset }
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
        const { open, display, isNew } = this.state;
        const { selectedConversation } = state.conversations;
        const color = state.format.themeColor;

        const chatviewPanelStyle = this.calculateChatviewPanelStyle(state.format);

        const setSelectedConversation = (conversation: Conversation) => {
            this.store.dispatch<ChatActions>({
                type: 'Set_Messages',
                activities: mapMessagesToActivities(conversation.conversation_messages, state.connection.user.id)
            });
            this.store.dispatch<ChatActions>({
                type: 'Set_Selected_Conversation',
                conversation
            });
            this.forceUpdate();
        };

        const removeSelectedConversation = () => {
            this.store.dispatch<ChatActions>({
                type: 'Set_Messages',
                activities: []
            });
            this.store.dispatch<ChatActions>({
                type: 'Set_Selected_Conversation',
                conversation: null
            });
            this.setState({ isNew: false });
            this.forceUpdate();
        };

        // only render real stuff after we know our dimensions
        return (
            <Provider store={ this.store }>
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
                                <div className="wc-header" style={{borderBottomColor: color}}>
                                    {(selectedConversation || isNew) &&
                                        (<button onClick={() => removeSelectedConversation()} className="wc-header-backButton">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40px" height="40px"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
                                        </button>)
                                    }
                                    <img
                                        className="wc-header--logo"
                                        src={state.format.logoUrl ?
                                            state.format.logoUrl :
                                            'https://s3.amazonaws.com/com.gideon.static.dev/chatbot-header-default-v1.1.2.png'
                                        }
                                      />

                                  <span>{typeof state.format.chatTitle === 'string' ? state.format.chatTitle : 'Gideon' }</span>

                                    <img
                                        className="wc-header--close"
                                        onClick={() => {this.toggle(); }}
                                        src="https://s3.amazonaws.com/com.gideon.static.dev/chatbot/close.svg" />

                                    {/* <img
                                        className="wc-header--back"
                                        onClick={() => {this.step(); }}
                                        src="https://s3.amazonaws.com/com.gideon.static.dev/chatbot/back.svg" /> */}
                                </div>
                        }

                        {(selectedConversation || isNew)
                            ? <History
                                onCardAction={this._handleCardAction}
                                ref={this._saveHistoryRef}
                                gid={this.props.gid}
                                directLine={this.props.directLine}
                                handleIncomingActivity={(activity: Activity) => this.handleIncomingActivity(activity)}
                                isNew={isNew}
                            />
                            :  <PastConversations setSelectedConversation={setSelectedConversation} />
                        }

                        {(selectedConversation || isNew)
                            ? <Shell ref={ this._saveShellRef } />
                            : (<div className="new-conversation-button-wrapper">
                                 <button className="new-conversation-button" onClick={() => this.newConversationClick()}>Begin a New Conversation</button>
                               </div>
                            )
                        }

                        <div className="wc-footer">
                            <a href="https://gideon.legal">
                                <span>Powered by</span>
                                <img
                                    className="wc-footer--logo"
                                    src="https://s3.amazonaws.com/com.gideon.static.dev/logotype-v1.1.0.svg"
                                />
                            </a>
                        </div>

                        {
                            this.props.resize === 'detect' &&
                                <ResizeDetector onresize={ this.resizeListener } />
                        }

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
