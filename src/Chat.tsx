import * as React from 'react';
import { findDOMNode } from 'react-dom';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';

import { parseReferrer } from 'analytics-utils';

import ConvoHistory from './ConversationHistory';
import { IconButton, ThemeProvider } from '@material-ui/core';
import { ArrowBack, ThumbUpSharp } from '@material-ui/icons';
import { HistoryInline } from './assets/icons/HistoryInline'

import { Activity, CardActionTypes, DirectLine, DirectLineOptions, IBotConnection, User, Conversation } from 'botframework-directlinejs';
import { isMobile } from 'react-device-detect';
import { connect, Provider } from 'react-redux';
import { conversationHistory, mapMessagesToActivities, ping, step, verifyConversation, checkNeedBackButton, conversationList } from './api/bot';
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
    showConvoHistory: boolean;
    back_visible: boolean;
    node_count: number;
    pastConversations: any[];
    messages: any[];
    loading: boolean;
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
        clicked: false,
        back_visible: false,
        orginalBodyClass: document.body.className,
        node_count: -1,
        showConvoHistory: false,
        pastConversations: [] as any,
        messages: [] as any,
        loading: true
    };

   // private clicked: any; // status of if the back button has been clicked already

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

    private initialOpen = false;
    private reloadMsgsCalled = false;

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
        console.log("in handle activity")
        console.log("activity in handle activity: ", activity)
        console.log(this.store.getState().history.activities[this.store.getState().history.activities.length - 1])
        console.log(this.store.getState().history.activities)
        const activityCopy: any = activity;
        let lastActivity: any;
        lastActivity = this.store.getState().history.activities[this.store.getState().history.activities.length - 1]
        let secondLastActivity: any;
        secondLastActivity = this.store.getState().history.activities[this.store.getState().history.activities.length - 2]
        const state = this.store.getState();
        this.toggleBackButton(false);
        let alreadyContains = false;
        //checking if history.activities contains same text and message type as incoming activity
        let i: any;
        for(i of this.store.getState().history.activities){
            if(i.text === activityCopy.text && i.type === activityCopy.type && "GIDEON_MESSAGE_START" !== activityCopy.text){
                alreadyContains = true;
            }
        }
        console.log("alreadContains ", alreadyContains)
        if(this.store.getState().history.activities.length == 0 ||
            //(lastActivity && lastActivity.text !== activityCopy.text || lastActivity.type !== activityCopy.type && "GIDEON_MESSAGE_START" !== activityCopy.text) ){
            !alreadyContains ||
            (lastActivity && lastActivity.text === activityCopy.text && lastActivity.type !== activityCopy.type && "GIDEON_MESSAGE_START" !== activityCopy.text && !alreadyContains)){
            console.log('inside if statement')
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
                    //set convoComplete to true if current convo is finished
                    if(notNode === "handoff") sessionStorage.setItem("convoComplete", 'true');
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
                    this.toggleBackButton(false);
                    if (activity.from.id !== state.connection.user.id) {
                        this.store.dispatch<ChatActions>({ type: 'Show_Typing', activity });
                        this.store.dispatch<ChatActions>({type: 'Toggle_Input', showConsole: false});
                        this.store.dispatch<ChatActions>({type: 'Toggle_InputEnabled', inputEnabled: false});
                    }
                    break;
            } 
        } else if(activityCopy.from.id !== localStorage.getItem("msft_user_id")) {
            console.log('else if statement')
            console.log('activityCopy.from.id !== localStorage.getItem("msft_user_id"')
            this.store.dispatch<ChatActions>({ type: activity.from.id === state.connection.user.id ? 'Receive_Sent_Message' : 'Receive_Message', activity });
        } else {
            console.log("else statement")
        }
        
       // this.setState({
       //     loading: false
       // });
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
        });
        sessionStorage.setItem("node_count", new_count.toString());
    }

    private deleteNodeCount = (amount: number) => {
        const curr_node = this.checkNodeCount();
        if (curr_node > 0){
            const updated_count = curr_node - amount;
            this.setState({
                node_count: updated_count
            });
            this.state.node_count = updated_count;
            sessionStorage.setItem("node_count", updated_count.toString());
            this.toggleBackButton(true);
        } 
        const updated_count = this.checkNodeCount()
        if (updated_count <= 0) {
            this.setState({
                node_count: 0
            });
            this.state.node_count = 0;
            sessionStorage.setItem("node_count", "0");
            this.toggleBackButton(false);
        }
    }

    private checkNodeCount = () => {
        return this.state.node_count;
    }

    private clicked = (show: boolean) => {
        //this.toggleBackButton(false);
        //document.getElementById('btn1').style.pointerEvents = 'none';
        //document.getElementById('btn3').style.pointerEvents = 'none';
        if (show == true){
            document.getElementById('btn3').style.pointerEvents = 'none';

        } else {
            document.getElementById('btn3').style.pointerEvents = 'auto';

        }
        console.log(document.getElementById('btn3').style.pointerEvents)
        this.setState({
            clicked: show
        })  
    }

    private reload_messages = (messageId?: string|null) => {
        console.log("reload_msg")
        const botConnection: any = this.store.getState().connection.botConnection;
        console.log("before the if botconnection")
        if(botConnection && botConnection.conversationId){
            console.log("after the if botconnection")
            conversationHistory(this.props.gid, this.props.directLine.secret, botConnection.conversationId, messageId)
                .then((res: any) => {
                    const messages = res.data.messages.reverse();
                    console.log("messages")
                    console.log(messages)
                    console.log(Number(sessionStorage.getItem("original_length")), this.store.getState().history.activities.length );
                    //if((Number(sessionStorage.getItem("original_length")) != this.store.getState().history.activities.length) || this.store.getState().history.activities.length == messages.length && messages[messages.length-1].sender_type == 'bot'){
                    // if((Number(sessionStorage.getItem("original_length")) != this.store.getState().history.activities.length && messages[messages.length-1].sender_type == 'bot') || this.store.getState().history.activities.length == messages.length && messages[messages.length-1].sender_type == 'bot'){
                    //     console.log("removed last message")
                    //     messages.pop();
                    // }
                    const message_activities = mapMessagesToActivities(messages, this.store.getState().connection.user.id)

                    console.log("const messages = ", messages);

                    this.props.showConsole === false;
                    this.store.dispatch<ChatActions>({type: 'Toggle_Input', showConsole: false});
                    this.store.dispatch<ChatActions>({type: 'Toggle_InputEnabled', inputEnabled: false});

                    //if(message_activities[message_activities.length - 1].from.id === "") message_activities.pop()

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
                        this.toggleBackButton(true)
                        this.store.dispatch<ChatActions>({type: 'Toggle_Input', showConsole: true});
                        this.store.dispatch<ChatActions>({type: 'Toggle_InputEnabled', inputEnabled: true});
                        
                        this.store.dispatch<ChatActions>(
                            { type: 'Receive_Message',
                            activity: message_activities[message_activities.length-1]}
                        )
                    };

                    this.setState({
                        loading: false
                    });
                    //sessionStorage.setItem('newConvo','false')
                    //sessionStorage.setItem('emptyChat','false')
                    this.deleteNodeCount(1);
            });
        }
    }

    //step function perfoms going back to the previous message
    private step = (messageId?: string|null) => {
        console.log("inside step")
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

                //sessionStorage.removeItem("node_count");
                this.clicked(false);

            });
        })
        .catch((err: any) => {
            console.log(err);
        });
         
    }

    private getConvoList = (userID: string, convoId: string) => {
        console.log("sending to convo list call")
        console.log(userID)
        console.log(convoId)
        this.setState({
            loading: true
        })
        conversationList(this.props.gid, userID, convoId)
        .then((res: any) => {
            this.setState({
                pastConversations: res.data.conversations.reverse()
            });  
            this.setState({
                loading: false
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

        if(sessionStorage.getItem("node_count")) {
            this.setState({
                node_count: Number(sessionStorage.getItem("node_count"))
            });
        }

        // initially always set to true
        let reloaded = performance.getEntriesByType('navigation')[0].type === 'reload' ? true : false;
        let isNew = true;

        //if newConvo exists in localstorage
        if(sessionStorage.getItem('newConvo') === 'true') {
            isNew = true;
            this.setState({
                loading: false
            });
        } else if(sessionStorage.getItem('newConvo') === 'false') {
            isNew = false;
            this.setState({
                loading: true
            });
        }

        let botConnection: any = null;

        //if it's not new convo, it's not a empty chat, or past convo being viewed
        if((reloaded && !isNew ) || (reloaded && sessionStorage.getItem('emptyChat') === 'false') || sessionStorage.getItem('pastConvoID')) {
            botConnection = this.props.directLine ?
                (this.botConnection = new DirectLine({
                    secret: this.props.directLine.secret,
                    conversationId: sessionStorage.getItem('pastConvoID') ? sessionStorage.getItem('pastConvoID') : sessionStorage.getItem('msft_conversation_id')
                })) :
                this.props.botConnection;
        } else {
            botConnection = this.props.directLine ? (this.botConnection = new DirectLine(this.props.directLine)) : this.props.botConnection;
            sessionStorage.setItem('emptyChat', 'true');
        }

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
                let conversationId = botCopy.conversationId;

                // if not new convo and there's a convo id in local storage
                if(reloaded && !isNew) {
                    conversationId = sessionStorage.getItem('msft_conversation_id');
                    console.log('convo id from local storage');
                } else if(sessionStorage.getItem('pastConvoID')) {
                    conversationId = sessionStorage.getItem('pastConvoID');
                }

                if (!state.connection.verification.attempted) {
                    this.store.dispatch<ChatActions>({
                        type: 'Set_Verification',
                        verification: {
                            attempted: true
                        }
                    });

                    const campaign = parseReferrer(document.referrer, window.location.href.toLowerCase());
                    console.log('campaign:', campaign, document.referrer, window.location.href.toLowerCase());

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
                        if(isNew && conversationId !== sessionStorage.getItem("pastConvoID")) {
                            window.sessionStorage.setItem('msft_conversation_id', conversationId);
                            window.localStorage.setItem('gid', this.props.gid);
                            window.localStorage.setItem('msft_user_id', user.id);
                        }

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

                            if(isNew && messages.length === 0) isNew = true;

                            this.store.dispatch<ChatActions>({
                                type: 'Set_Messages',
                                activities: mapMessagesToActivities(messages, state.connection.user.id)
                            });

                            //if(sessionStorage.getItem("convoComplete") && Boolean(sessionStorage.getItem("convoComplete"))) {
                                this.setState({
                                    loading: false
                                });
                                console.log("loading false in convo history")
                            //}
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

        this.setState({
            loading: false
        });

        if (this.props.selectedActivity) {
            this.selectedActivitySubscription = this.props.selectedActivity.subscribe(activityOrID => {
                this.store.dispatch<ChatActions>({
                    type: 'Select_Activity',
                    selectedActivity: activityOrID.activity || this.store.getState().history.activities.find(activity => activity.id === activityOrID.id)
                });
            });
        }

        this.initialOpen = this.state.open;

        //open === true if new convo or past convo
        if(Boolean(sessionStorage.getItem('newConvo')) || sessionStorage.getItem('pastConvoID') || (!sessionStorage.getItem('pastConvoID') && sessionStorage.getItem('emptyChat') && reloaded)) {
            this.initialOpen = true;
            console.log("intial open now")
        }

        this.getConvoList(localStorage.getItem('msft_user_id'),sessionStorage.getItem('msft_conversation_id'));
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

    // change state of showConvoHistory to show list of convos
    private handleHistory = (bool: boolean) => {
        this.getConvoList(localStorage.getItem('msft_user_id'),sessionStorage.getItem('msft_conversation_id'));

        this.setState({
            showConvoHistory: bool
        });

        if(!bool && sessionStorage.getItem('pastConvoID')) {
            window.location.reload();
            sessionStorage.removeItem('pastConvoID');
            sessionStorage.removeItem("convoComplete");
            sessionStorage.removeItem("pastConvoDate");
            sessionStorage.removeItem("original_length")
        }
    }

    private changeCurrentConversation = (convo: any) => {
        let currentConvoID = convo.msft_conversation_id;
        sessionStorage.setItem("pastConvoDate", convo.created_at);
        sessionStorage.setItem("convoComplete", convo.is_complete);
        //viewing current convo
        if(currentConvoID === sessionStorage.getItem("msft_conversation_id")) {
            this.handleHistory(false);
        } else {
            sessionStorage.setItem("pastConvoID", currentConvoID);
            window.location.reload();
        }
    }

    // At startup we do three render passes:
    // 1. To determine the dimensions of the chat panel (nothing needs to actually render here, so we don't)
    // 2. To determine the margins of any given carousel (we just render one mock activity so that we can measure it)
    // 3. (this is also the normal re-render case) To render without the mock activity

    render() {
        const state = this.store.getState();
        let { open, opened, display, fullscreen } = this.state;

        const chatviewPanelStyle = this.calculateChatviewPanelStyle(state.format);

        const backButtonClassName = classList(
            'wc-back-button',
            this.checkBackButton() === false && 'wc-back-button__disabled'
        )

        //stays open after reloading for a new convo or past convo
        if(this.initialOpen) {
            open = this.initialOpen;
        }

        //console.log("this.reloadMsgsCalled ", this.reloadMsgsCalled)
        //console.log(Number(sessionStorage.getItem("original_length")), this.store.getState().history.activities.length );

        //reload msg when reloaded and waits until all previous msg appear before reload_messages is called
        //only happens once every reload
        if(performance.getEntriesByType('navigation')[0].type === 'reload' 
            //either waits for all msg to load or checks if convo is complete
           && (((Number(sessionStorage.getItem("original_length")) === this.store.getState().history.activities.length) || Number(sessionStorage.getItem("original_length")) - this.store.getState().history.activities.length === -1 && Number(sessionStorage.getItem("original_length")) !== 0) || sessionStorage.getItem("convoComplete") === "true")
           && !this.reloadMsgsCalled
           && this.store.getState().connection.botConnection && this.store.getState().connection.botConnection.conversationId
        ) {
            this.reload_messages();
            this.reloadMsgsCalled = true;
        }

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
                        { // different header for current convo and history
                            !!state.format.chatTitle && !this.state.showConvoHistory ?
                                <div className={!fullscreen ? 'wc-header' : 'wc-header wc-header-fullscreen'} style={{backgroundColor: state.format.themeColor}}>
                                    <img
                                        className="wc-header--logo"
                                        src={state.format.logoUrl ?
                                            state.format.logoUrl :
                                            'https://s3.amazonaws.com/com.gideon.static.dev/chatbot-header-default-v1.1.2.png'
                                        }
                                    />
                                    {
                                        typeof state.format.chatTitle === 'string' && state.format.chatTitle.length > 45 ? 
                                            <span style={{ fontSize: "16px", marginRight:"0px", marginLeft:"35px", textAlign:"center" }}>{typeof state.format.chatTitle === 'string' ? state.format.chatTitle : 'Gideon' }</span>
                                            :
                                            <span style={{ fontSize: "18px", marginRight:"0px", marginLeft:"40px", textAlign:"center" }}>{typeof state.format.chatTitle === 'string' ? state.format.chatTitle : 'Gideon' }</span>
                                    }
                                    <IconButton onClick={() => this.handleHistory(true)} className="icon__button history__button" style={{ height: "auto" }}>
                                        <HistoryInline />
                                    </IconButton>
                                    {/* Close X image on chat */}
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={() => {this.toggle(); this.initialOpen = false;}} >
                                        <title>wc-header--close</title>
                                        <path className="wc-header--close" d="M18 2L2 18" stroke="#FCFCFC" stroke-width="3" stroke-linecap="round" />
                                        <path className="wc-header--close" d="M2 2L18 18" stroke="#FCFCFC" stroke-width="3" stroke-linecap="round" />
                                    </svg>
                                    {/* <img
                                        className="wc-header--close"
                                        onClick={() => {this.toggle(); }}
                                        src="https://s3.amazonaws.com/com.gideon.static.dev/chatbot/close.svg" /> */}

                                    {/* <img
                                        className="wc-header--back"
                                        onClick={() => {this.step(); }}
                                        src="https://s3.amazonaws.com/com.gideon.static.dev/chatbot/back.svg" /> */}
                                </div>
                                :
                                <div className={!fullscreen ? 'history-header wc-header' : 'wc-header wc-header-fullscreen'}>
                                    <IconButton onClick={() => this.handleHistory(false)}  className="icon__button" style={{ padding: 0, color: 'white', height: "auto" }}>
                                        <ArrowBack className="back__button" />
                                    </IconButton>
                                    <span>Current Conversation</span>
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
                            {/* current convo or history? */}
                            {!this.state.showConvoHistory ?
                                (this.state.loading ?
                                    <div className="wc-chatbot-content-right">
                                        <div id="loading-bar-spinner" className="spinner"><div className="spinner-icon"></div></div>
                                    </div>
                                    :
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
                                            { 
                                                <label 
                                                    className="wcbackbutton" onClick={() => {
                                                            this.clicked(true)
                                                            this.step(); 

                                                            this.deleteNodeCount(2);
                                                            // var button = this.state; // temp variable in order to change state of clicked
                                                            // button.clicked = true; // changes state within variable to true
                                                            // this.setState(button); // passes updated boolean back to state
                                                        
                                                    }}>

                                                   <label style={{cursor: 'pointer'}}>
                                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                            <svg width="94" height="56" viewBox="0 0 94 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="1" y="1" width="92" height="54" rx="1" fill = "#F8F8F8" stroke="#F8F8F8" stroke-width="2"/>
                                                <path d="M49.488 33.768C49.9307 33.768 50.312 33.7173 50.632 33.616C50.952 33.5147 51.2133 33.3733 51.416 33.192C51.624 33.0053 51.776 32.7867 51.872 32.536C51.968 32.28 52.016 32 52.016 31.696C52.016 31.104 51.8053 30.6373 51.384 30.296C50.9627 29.9493 50.3307 29.776 49.488 29.776H47.008V33.768H49.488ZM47.008 24.76V28.672H49.056C49.4933 28.672 49.872 28.624 50.192 28.528C50.5173 28.432 50.784 28.2987 50.992 28.128C51.2053 27.9573 51.3627 27.752 51.464 27.512C51.5653 27.2667 51.616 27 51.616 26.712C51.616 26.0347 51.4133 25.5413 51.008 25.232C50.6027 24.9173 49.9733 24.76 49.12 24.76H47.008ZM49.12 23.536C49.824 23.536 50.4293 23.6053 50.936 23.744C51.448 23.8827 51.8667 24.08 52.192 24.336C52.5227 24.592 52.7653 24.9067 52.92 25.28C53.0747 25.648 53.152 26.064 53.152 26.528C53.152 26.8107 53.1067 27.0827 53.016 27.344C52.9307 27.6 52.8 27.84 52.624 28.064C52.448 28.288 52.224 28.4907 51.952 28.672C51.6853 28.848 51.3707 28.992 51.008 29.104C51.8507 29.264 52.4827 29.5653 52.904 30.008C53.3307 30.4453 53.544 31.0213 53.544 31.736C53.544 32.2213 53.4533 32.664 53.272 33.064C53.096 33.464 52.8347 33.808 52.488 34.096C52.1467 34.384 51.7253 34.608 51.224 34.768C50.7227 34.9227 50.152 35 49.512 35H45.464V23.536H49.12ZM59.7388 31.352C59.0828 31.3733 58.5228 31.4267 58.0588 31.512C57.6001 31.592 57.2241 31.6987 56.9308 31.832C56.6428 31.9653 56.4321 32.1227 56.2988 32.304C56.1708 32.4853 56.1068 32.688 56.1068 32.912C56.1068 33.1253 56.1414 33.3093 56.2108 33.464C56.2801 33.6187 56.3734 33.7467 56.4908 33.848C56.6134 33.944 56.7548 34.016 56.9148 34.064C57.0801 34.1067 57.2561 34.128 57.4428 34.128C57.6934 34.128 57.9228 34.104 58.1308 34.056C58.3388 34.0027 58.5334 33.928 58.7148 33.832C58.9014 33.736 59.0774 33.6213 59.2428 33.488C59.4134 33.3547 59.5788 33.2027 59.7388 33.032V31.352ZM55.1388 28.04C55.5868 27.608 56.0694 27.2853 56.5868 27.072C57.1041 26.8587 57.6774 26.752 58.3068 26.752C58.7601 26.752 59.1628 26.8267 59.5148 26.976C59.8668 27.1253 60.1628 27.3333 60.4028 27.6C60.6428 27.8667 60.8241 28.1893 60.9468 28.568C61.0694 28.9467 61.1308 29.3627 61.1308 29.816V35H60.4988C60.3601 35 60.2534 34.9787 60.1788 34.936C60.1041 34.888 60.0454 34.7973 60.0028 34.664L59.8428 33.896C59.6294 34.0933 59.4214 34.2693 59.2188 34.424C59.0161 34.5733 58.8028 34.7013 58.5788 34.808C58.3548 34.9093 58.1148 34.9867 57.8588 35.04C57.6081 35.0987 57.3281 35.128 57.0188 35.128C56.7041 35.128 56.4081 35.0853 56.1308 35C55.8534 34.9093 55.6108 34.776 55.4028 34.6C55.2001 34.424 55.0374 34.2027 54.9148 33.936C54.7974 33.664 54.7388 33.344 54.7388 32.976C54.7388 32.656 54.8268 32.3493 55.0028 32.056C55.1788 31.7573 55.4641 31.4933 55.8588 31.264C56.2534 31.0347 56.7681 30.848 57.4028 30.704C58.0374 30.5547 58.8161 30.4693 59.7388 30.448V29.816C59.7388 29.1867 59.6028 28.712 59.3308 28.392C59.0588 28.0667 58.6614 27.904 58.1388 27.904C57.7868 27.904 57.4908 27.9493 57.2508 28.04C57.0161 28.1253 56.8108 28.224 56.6348 28.336C56.4641 28.4427 56.3148 28.5413 56.1868 28.632C56.0641 28.7173 55.9414 28.76 55.8188 28.76C55.7228 28.76 55.6401 28.736 55.5708 28.688C55.5014 28.6347 55.4428 28.5707 55.3947 28.496L55.1388 28.04ZM68.9399 28.336C68.8972 28.3947 68.8545 28.44 68.8119 28.472C68.7692 28.504 68.7105 28.52 68.6359 28.52C68.5559 28.52 68.4679 28.488 68.3719 28.424C68.2759 28.3547 68.1559 28.28 68.0119 28.2C67.8732 28.12 67.6999 28.048 67.4919 27.984C67.2892 27.9147 67.0385 27.88 66.7399 27.88C66.3399 27.88 65.9879 27.952 65.6839 28.096C65.3799 28.2347 65.1239 28.4373 64.9159 28.704C64.7132 28.9707 64.5585 29.2933 64.4519 29.672C64.3505 30.0507 64.2999 30.4747 64.2999 30.944C64.2999 31.4347 64.3559 31.872 64.4679 32.256C64.5799 32.6347 64.7372 32.9547 64.9399 33.216C65.1479 33.472 65.3959 33.6693 65.6839 33.808C65.9772 33.9413 66.3052 34.008 66.6679 34.008C67.0145 34.008 67.2999 33.968 67.5239 33.888C67.7479 33.8027 67.9319 33.7093 68.0759 33.608C68.2252 33.5067 68.3479 33.416 68.4439 33.336C68.5452 33.2507 68.6439 33.208 68.7399 33.208C68.8572 33.208 68.9479 33.2533 69.0119 33.344L69.4119 33.864C69.2359 34.0827 69.0359 34.2693 68.8119 34.424C68.5879 34.5787 68.3452 34.7093 68.0839 34.816C67.8279 34.9173 67.5585 34.992 67.2759 35.04C66.9932 35.088 66.7052 35.112 66.4119 35.112C65.9052 35.112 65.4332 35.0187 64.9959 34.832C64.5639 34.6453 64.1879 34.376 63.8679 34.024C63.5479 33.6667 63.2972 33.2293 63.1159 32.712C62.9345 32.1947 62.8439 31.6053 62.8439 30.944C62.8439 30.3413 62.9265 29.784 63.0919 29.272C63.2625 28.76 63.5079 28.32 63.8279 27.952C64.1532 27.5787 64.5505 27.288 65.0199 27.08C65.4945 26.872 66.0385 26.768 66.6519 26.768C67.2225 26.768 67.7239 26.8613 68.1559 27.048C68.5932 27.2293 68.9799 27.488 69.3159 27.824L68.9399 28.336ZM72.3725 23.216V30.152H72.7405C72.8472 30.152 72.9352 30.1387 73.0045 30.112C73.0792 30.08 73.1565 30.0187 73.2365 29.928L75.7965 27.184C75.8712 27.0933 75.9485 27.024 76.0285 26.976C76.1138 26.9227 76.2258 26.896 76.3645 26.896H77.6525L74.6685 30.072C74.5245 30.2533 74.3698 30.3947 74.2045 30.496C74.3005 30.56 74.3858 30.6347 74.4605 30.72C74.5405 30.8 74.6152 30.8933 74.6845 31L77.8525 35H76.5805C76.4578 35 76.3512 34.9813 76.2605 34.944C76.1752 34.9013 76.1005 34.8267 76.0365 34.72L73.3725 31.4C73.2925 31.288 73.2125 31.216 73.1325 31.184C73.0578 31.1467 72.9405 31.128 72.7805 31.128H72.3725V35H70.9405V23.216H72.3725Z" 
                                                    fill = {(this.state.clicked ? '#979797' : '#3F6DE1' )}/>
                                                <path d="M32.75 27.858H17.925L22.4625 22.8755C22.6747 22.6422 22.7768 22.3413 22.7463 22.0391C22.7158 21.737 22.5553 21.4582 22.3 21.2643C22.0447 21.0703 21.7156 20.977 21.3851 21.0048C21.0546 21.0327 20.7497 21.1795 20.5375 21.4128L14.2875 28.2694C14.2455 28.3239 14.2078 28.3812 14.175 28.4408C14.175 28.4979 14.175 28.5322 14.0875 28.5893C14.0308 28.7203 14.0012 28.8598 14 29.0007C14.0012 29.1416 14.0308 29.2811 14.0875 29.4121C14.0875 29.4692 14.0875 29.5035 14.175 29.5607C14.2078 29.6202 14.2455 29.6775 14.2875 29.7321L20.5375 36.5886C20.655 36.7176 20.8022 36.8213 20.9686 36.8924C21.1349 36.9635 21.3164 37.0003 21.5 37C21.7921 37.0005 22.0751 36.9075 22.3 36.7372C22.4266 36.6412 22.5312 36.5234 22.6079 36.3905C22.6846 36.2575 22.7318 36.112 22.7469 35.9623C22.762 35.8127 22.7447 35.6617 22.6959 35.5182C22.6471 35.3747 22.5678 35.2414 22.4625 35.1259L17.925 30.1435H32.75C33.0815 30.1435 33.3995 30.0231 33.6339 29.8088C33.8683 29.5945 34 29.3038 34 29.0007C34 28.6976 33.8683 28.407 33.6339 28.1927C33.3995 27.9784 33.0815 27.858 32.75 27.858Z" 
                                                    fill = {(this.state.clicked ? '#979797' : '#3F6DE1' )}/>
                                            </svg>
                                            </div>
                                        </label>
                                                </label>
                                            }   
                                            </div> 
                                        }

                                                {/* TODO - temporarily commented out for all users to accomodate a new client */}
                                                {/* <a href="https://gideon.legal">
                                                <span>Powered by</span>
                                                <img
                                                    className="wc-footer--logo"
                                                    src="https://s3.amazonaws.com/com.gideon.static.dev/logotype-v1.1.0.svg"
                                                    />
                                                </a> */}

                                        {
                                            this.props.resize === 'detect' &&
                                                <ResizeDetector onresize={ this.resizeListener } />
                                        }
                                    </div>)
                                :
                                (<div className="wc-chatbot-content-right" style={{paddingTop:'67px'}}>
                                    { this.state.loading ? 
                                        <div id="loading-bar-spinner" className="spinner"><div className="spinner-icon"></div></div>
                                        :
                                        <ConvoHistory conversations={this.state.pastConversations} setCurrentConversation={this.changeCurrentConversation}/>
                                    }
                                </div>)
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

export const classList = (...args: (string | boolean)[]) => {
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
