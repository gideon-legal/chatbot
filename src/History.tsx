import { Activity, CardActionTypes, DirectLineOptions, Message, User } from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { ActivityView } from './ActivityView';
import { activityWithSuggestedActions } from './activityWithSuggestedActions';
import { classList, doCardAction, IDoCardAction } from './Chat';
import { activityIsDisclaimer, DisclaimerCard } from './DisclaimerCard';
import { DisclaimerCardReadOnly } from './DisclaimerCardReadOnly';
import { FileUploadCardReadOnly } from './FileUploadCardReadOnly';
import { EsignCardReadOnly } from './EsignCardReadOnly';
import { DocassembleCard } from './DocassembleCard';
import * as konsole from './Konsole';
import { ChatState, FormatState, SizeState } from './Store';
import { sendMessage } from './Store';
import { VideoCard } from './VideoCard';

export interface HistoryProps {
    format: FormatState;
    size: SizeState;
    activities: Activity[];
    hasActivityWithSuggestedActions: Activity;

    setMeasurements: (carouselMargin: number) => void;
    onClickRetry: (activity: Activity) => void;
    onClickCardAction: () => void;

    isFromMe: (activity: Activity) => boolean;
    isSelected: (activity: Activity) => boolean;
    onClickActivity: (activity: Activity) => React.MouseEventHandler<HTMLDivElement>;

    onCardAction: () => void;
    doCardAction: IDoCardAction;
    gid: string;
    directLine: DirectLineOptions;
    inputEnabled: boolean;
}

export interface HistoryState {
    filesList: { [index: number]: { name: string, url: string }[] };
}

export class HistoryView extends React.Component<HistoryProps, HistoryState> {
    private scrollMe: HTMLDivElement;
    private scrollContent: HTMLDivElement;
    private scrollToBottom = true;
    private newConvoPrompt = false;

    private carouselActivity: WrappedActivity;
    private largeWidth: number;

    constructor(props: HistoryProps) {
        super(props);
        this.state = { filesList: {} };
        this.addFilesToState = this.addFilesToState.bind(this);
    }

    componentDidMount(): void {
        // prompt to start new convo only shows up when:
        // - page was refreshed
        // - chat wasn't empty before the page refresh
        // - not a new convo being started
        
        this.newConvoPrompt = false;
        
        if(performance.getEntriesByType('navigation')[0].type === 'reload' 
            && (!sessionStorage.getItem('newConvo') || sessionStorage.getItem('newConvo') !== 'true')
            && (!sessionStorage.getItem('emptyChat') || sessionStorage.getItem('emptyChat') !== 'true')
            && sessionStorage.getItem('original_length')
           // && !sessionStorage.getItem("pastConvoID")
        ){
           // console.log(this.props)
            //sessionStorage.setItem("loading", 'true');
            this.newConvoPrompt = true;
           // sessionStorage.setItem("loading","false")
           // console.log("in history, setting loading to false 1")
        } else if(sessionStorage.getItem("pastConvoID") && (!sessionStorage.getItem("convoComplete") || sessionStorage.getItem("convoComplete") === "null")) {
        //prompt disappears if uncompleted past convo is being viewed
       
            this.newConvoPrompt = false;
        }
    }

    componentWillUpdate(nextProps: HistoryProps) {
        let scrollToBottomDetectionTolerance = 1;

        if (!this.props.hasActivityWithSuggestedActions && nextProps.hasActivityWithSuggestedActions) {
            scrollToBottomDetectionTolerance = 58; // this should be in-sync with $actionsHeight scss var
        }

        this.scrollToBottom = (Math.abs(this.scrollMe.scrollHeight - this.scrollMe.scrollTop - this.scrollMe.offsetHeight) <= scrollToBottomDetectionTolerance);
    }

    componentDidUpdate() {

        if (this.props.format.carouselMargin === undefined) {
            // After our initial render we need to measure the carousel width

            // Measure the message padding by subtracting the known large width
            const paddedWidth = measurePaddedWidth(this.carouselActivity.messageDiv) - this.largeWidth;

            // offsetParent could be null if we start initially hidden
            const offsetParent = this.carouselActivity.messageDiv.offsetParent as HTMLElement;

            if (offsetParent) {
                // Subtract the padding from the offsetParent's width to get the width of the content
                const maxContentWidth = offsetParent.offsetWidth - paddedWidth;

                // Subtract the content width from the chat width to get the margin.
                // Next time we need to get the content width (on a resize) we can use this margin to get the maximum content width
                const carouselMargin = this.props.size.width - maxContentWidth;

                // Finally, save it away in the Store, which will force another re-render
                this.props.setMeasurements(carouselMargin);

                this.carouselActivity = null; // After the re-render this activity doesn't exist
            }
        }

        this.autoscroll();
    }

    private autoscroll() {
        const lastActivity = this.props.activities[this.props.activities.length - 1];
        const lastActivityFromMe = lastActivity && this.props.isFromMe && this.props.isFromMe(lastActivity);

        // Validating if we are at the bottom of the list or the last activity was triggered by the user.
        if (this.scrollToBottom || lastActivityFromMe) {
            this.scrollMe.scrollTop = this.scrollMe.scrollHeight - this.scrollMe.offsetHeight;
        }
    }

    // In order to do their cool horizontal scrolling thing, Carousels need to know how wide they can be.
    // So, at startup, we create this mock Carousel activity and measure it.
    private measurableCarousel = () =>
        // find the largest possible message size by forcing a width larger than the chat itself
        <WrappedActivity
            ref={ x => this.carouselActivity = x }
            activity={ {
                type: 'message',
                id: '',
                from: { id: '' },
                attachmentLayout: 'carousel'
            } }
            nextActivityFromMe={ false }
            lastMessage={false}
            format={ null }
            fromMe={ false }
            displayName={ false }
            onClickActivity={ null }
            onClickRetry={ null }
            selected={ false }
            showTimestamp={ false }
            gid={null}
            files={[]}
            addFilesToState={ null }
            index={ -1 }
            inputEnabled={ false }
        >
            <div style={ { width: this.largeWidth } }>&nbsp;</div>
        </WrappedActivity>

    // At startup we do three render passes:
    // 1. To determine the dimensions of the chat panel (not much needs to actually render here)
    // 2. To determine the margins of any given carousel (we just render one mock activity so that we can measure it)
    // 3. (this is also the normal re-render case) To render without the mock activity

    private doCardAction(type: CardActionTypes, value: string | object) {
        this.props.onClickCardAction();
        // tslint:disable-next-line:no-unused-expression
        this.props.onCardAction && this.props.onCardAction();
        return this.props.doCardAction(type, value);
    }

    private addFilesToState(index: number, files: { name: string, url: string }[]) {
        this.setState(prevState => ({ filesList: { ...prevState.filesList, [index]: files } }));
    }

    private startNewConvo() {
        
        sessionStorage.setItem('newConvo', 'true');
        sessionStorage.setItem('emptyChat', 'true');
        sessionStorage.removeItem("msft_conversation_id");
        sessionStorage.removeItem("node_count");
        sessionStorage.removeItem('pastConvoID');
        sessionStorage.removeItem('pastConvoDate');
        window.location.reload();
    }

    render() {
        let content;
        let lastActivityIsDisclaimer = false;
        let activityDisclaimer: any;

        //if convo is finished, prompt will appear
        if(sessionStorage.getItem("convoComplete") && (!sessionStorage.getItem("pastConvoID") || sessionStorage.getItem("pastConvoID") === "null")) {
            
            this.newConvoPrompt = true;
           // sessionStorage.setItem("loading","true")
           // console.log("in history, setting loading to false")
          
        }

        if (this.props.size.width !== undefined) {
            if (this.props.format.carouselMargin === undefined) {
                // For measuring carousels we need a width known to be larger than the chat itself
                this.largeWidth = this.props.size.width * 2;
                content = <this.measurableCarousel/>;
            } else {
                console.log("history else")
                const activities = filteredActivities(this.props.activities, this.props.format.strings.pingMessage);
                activityDisclaimer = activities.length > 0 ? activities[activities.length - 1] : undefined;
                lastActivityIsDisclaimer = activityDisclaimer && activityDisclaimer.entities && activityDisclaimer.entities.length > 0 && activityDisclaimer.entities[0].node_type === 'disclaimer';
                console.log("history activites")
                console.log(activities);
                content = activities
                .map((activity, index) => {
                        // for cases where user refreshes before any messages appear
                        // saves message id of last message given
                        if(this.props.isFromMe(activity) && activities.length > 1) {
                            sessionStorage.setItem('emptyChat', 'false');

                            //removes newconvo from storage once user responds
                            if(sessionStorage.getItem("newConvo")) sessionStorage.removeItem("newConvo")
                        }
                        
                        return (
                          
                            ((activity.type !== 'message' || activity.text || (activity.attachments && !!activity.attachments.length))) &&
                                <WrappedActivity
                                    format={ this.props.format }
                                    key={ 'message' + index }
                                    activity={ activity }
                                    nextActivityFromMe={ index + 1 < activities.length ? this.props.isFromMe(activities[index + 1]) : false}
                                    doCardAction={this.doCardAction}
                                    lastMessage={index === activities.length - 1}
                                    showTimestamp={ index === activities.length - 1 || (index + 1 < activities.length && suitableInterval(activity, activities[index + 1])) }
                                    selected={ this.props.isSelected(activity) }
                                    fromMe={ this.props.isFromMe(activity) }
                                    displayName={ index === 0 || (!this.props.isFromMe(activity) && this.props.isFromMe(activities[index - 1]))}
                                    onClickActivity={ this.props.onClickActivity(activity) }
                                    onClickRetry={e => {
                                        // Since this is a click on an anchor, we need to stop it
                                        // from trying to actually follow a (nonexistant) link
                                        e.preventDefault();
                                        e.stopPropagation();
                                        this.props.onClickRetry(activity);
                                    } }
                                    gid={ this.props.gid }
                                    directLine={ this.props.directLine }
                                    files={ index in this.state.filesList ? this.state.filesList[index] : [] }
                                    addFilesToState={this.addFilesToState}
                                    index={ index }
                                    inputEnabled={ this.props.inputEnabled }
                                >
                                    <ActivityView
                                        format={ this.props.format }
                                        size={ this.props.size }
                                        activity={ activity }
                                        type={activity.type}
                                        onCardAction={ (type: CardActionTypes, value: string | object) => this.doCardAction(type, value) }
                                        onImageLoad={ () => this.autoscroll() }
                                        gid={ this.props.gid}
                                        directLine={ this.props.directLine }
                                        addFilesToState={this.addFilesToState}
                                        index={ index }
                                    />
                                </WrappedActivity>
                        )
                    }
                );

                let reloaded = performance.getEntriesByType('navigation')[0].type === 'reload';

                //saves the length of activities for prompt timing
                if(!this.newConvoPrompt || (this.newConvoPrompt && !sessionStorage.getItem("original_length"))) {
                //if(!reloaded && !Boolean(sessionStorage.getItem("newConvo")) && !Boolean(sessionStorage.getItem("pastConvoID"))) {
                    sessionStorage.setItem("original_length", activities.length.toString());
                }

                //instances where prompt disappears
                if(activities[activities.length - 1]) {
                    //prompt disappears once user interacts with it
                    if(reloaded && activities[activities.length - 1].from.id === localStorage.getItem("msft_user_id") && !Number.isInteger(Number(activities[activities.length - 1].id))){    
                        this.newConvoPrompt = false;
                        
                    //prompt disappears after back button pressed
                    } else if(Number(sessionStorage.getItem("original_length")) - 1 > activities.length && this.newConvoPrompt){
                        this.newConvoPrompt = false;
                        
                    }
                }
            }
        }

        let date: any;

        //changing time at top of chat for past ones
        if(sessionStorage.getItem("pastConvoDate")) {
            date = new Date(sessionStorage.getItem("pastConvoDate"));
            date = date.toLocaleDateString();
        }

        const groupsClassName = classList('wc-message-groups', !this.props.format.chatTitle && 'no-header',  this.props.format.fullscreen && 'wc-message-groups-fullscreen', !this.props.inputEnabled && 'no-console');
        return (
            <div>
            <div
                className={ groupsClassName }
                ref={ div => this.scrollMe = div || this.scrollMe }
                role="log"
                tabIndex={ 0 }
            >
                <div className="wc-message-group-content" ref={ div => { if (div) { this.scrollContent = div; } }}>
                    <div className="wc-date-header">
                        <div className="wc-date-header-line"></div>
                        <div className="wc-date-header-text">{ date ? date : moment().format('MM/DD/YYYY') }</div>
                        <div className="wc-date-header-line"></div>
                    </div>
                    { content }
                    {/* prompt to start new convo if page refreshed */}
                    { this.newConvoPrompt &&
                        <div className="new__convo" style={{ color:'#727272', textAlign: 'center', padding: "20px 0", lineHeight: "20px" }}>Do you want to start a new session?
                            <br />
                            <a onClick={this.startNewConvo} style={{ color:'#3F6DE1', marginLeft: '5px', cursor: 'pointer', paddingTop: "20px" }}>
                                Click here to start new
                            </a>
                        </div>
                    }
                </div>
            </div>
            {/* {lastActivityIsDisclaimer && <DisclaimerCard activity={activityDisclaimer} onImageLoad={ () => this.autoscroll() }/>} */}
            </div>
        );
    }
}

export const History = connect(
    (state: ChatState) => ({
        // passed down to HistoryView
        format: state.format,
        size: state.size,
        activities: state.history.activities,
        hasActivityWithSuggestedActions: !!activityWithSuggestedActions(filteredActivities(state.history.activities, state.format.strings.pingMessage)),
        inputEnabled: state.history.inputEnabled,
        // only used to create helper functions below
        connectionSelectedActivity: state.connection.selectedActivity,
        selectedActivity: state.history.selectedActivity,
        botConnection: state.connection.botConnection,
        user: state.connection.user,
        
    }), {
        setMeasurements: (carouselMargin: number) => ({ type: 'Set_Measurements', carouselMargin }),
        onClickRetry: (activity: Activity) => ({ type: 'Send_Message_Retry', clientActivityId: activity.channelData.clientActivityId }),
        onClickCardAction: () => ({ type: 'Card_Action_Clicked'}),
        // only used to create helper functions below
        sendMessage
    }, (stateProps: any, dispatchProps: any, ownProps: any): HistoryProps => ({
        // from stateProps
        format: stateProps.format,
        size: stateProps.size,
        activities: stateProps.activities,
        hasActivityWithSuggestedActions: stateProps.hasActivityWithSuggestedActions,
        inputEnabled: stateProps.inputEnabled,
        // from dispatchProps
        setMeasurements: dispatchProps.setMeasurements,
        onClickRetry: dispatchProps.onClickRetry,
        onClickCardAction: dispatchProps.onClickCardAction,
        // helper functions
        doCardAction: doCardAction(stateProps.botConnection, stateProps.user, stateProps.format.locale, dispatchProps.sendMessage),
        isFromMe: (activity: Activity) => activity.from.id === stateProps.user.id,
        isSelected: (activity: Activity) => activity === stateProps.selectedActivity,
        onClickActivity: (activity: Activity) => stateProps.connectionSelectedActivity && (() => stateProps.connectionSelectedActivity.next({ activity })),
        onCardAction: ownProps.onCardAction,
        gid: ownProps.gid,
        directLine: ownProps.directLine,
    }), {
        withRef: true
    }
)(HistoryView);

export const filteredActivities = (activities: Activity[], pingMessage: string) => {
    const notPingMessage = (activity: Activity, index: number) => {
        return (activity.type !== 'message' || activity.text !== pingMessage);
    };

    // Remove initial ping message from list of activities. User should not see this
    return activities.filter(notPingMessage);
};

const getComputedStyleValues = (el: HTMLElement, stylePropertyNames: string[]) => {
    const s = window.getComputedStyle(el);
    const result: { [key: string]: number } = {};
    // tslint:disable-next-line:radix
    stylePropertyNames.forEach(name => result[name] = parseInt(s.getPropertyValue(name)));
    return result;
};

const measurePaddedHeight = (el: HTMLElement): number => {
    const paddingTop = 'padding-top';
    const paddingBottom = 'padding-bottom';
    const values = getComputedStyleValues(el, [paddingTop, paddingBottom]);
    return el.offsetHeight - values[paddingTop] - values[paddingBottom];
};

const measurePaddedWidth = (el: HTMLElement): number => {
    const paddingLeft = 'padding-left';
    const paddingRight = 'padding-right';
    const values = getComputedStyleValues(el, [paddingLeft, paddingRight]);
    return el.offsetWidth + values[paddingLeft] + values[paddingRight];
};

const suitableInterval = (current: Activity, next: Activity) =>
    Date.parse(next.timestamp) - Date.parse(current.timestamp) > 5 * 60 * 1000;

const findInitial = (title: string): string => {
  return title.toUpperCase().replace('THE ', '').trim()[0];
};

export interface WrappedActivityProps {
    activity: Activity;
    nextActivityFromMe: boolean;
    displayName: boolean;
    showTimestamp: boolean;
    selected: boolean;
    fromMe: boolean;
    format: FormatState;
    doCardAction?: IDoCardAction;
    lastMessage?: boolean;
    onClickActivity: React.MouseEventHandler<HTMLDivElement>;
    onClickRetry: React.MouseEventHandler<HTMLAnchorElement>;
    gid: string;
    directLine?: DirectLineOptions;
    files: { name: string, url: string }[];
    addFilesToState: (index: number, files: [{ name: string, url: string }]) => void;
    index: number;
    inputEnabled: boolean;
}

export class WrappedActivity extends React.Component<WrappedActivityProps, {}> {
    public messageDiv: HTMLDivElement;

    constructor(props: WrappedActivityProps) {
        super(props);
    }

    //a check for if the incoming activity contains video in activity.entities,
    // if present, then video card will populate after message bubble and before node card
    videoCheck(contentClassName: string, wrapperClassName: string) {

        const { lastMessage, activity, doCardAction } = this.props;
        if(activity){
            const activityCopy: any = activity;

            if(activityCopy && activityCopy.entities && activityCopy.entities.length > 0){

                const activityRequiresAdditionalInput = activityCopy.entities && activityCopy.entities.length > 0 && activityCopy.entities[0].node_type !== null;
    
                const activityActions = activityCopy.suggestedActions;
                // Check if there are suggessted acctions in the activity
                const activityHasSuggestedActions = activityActions && activityActions.actions && activityActions.actions.length > 0;
        
                const contactClassName = activityRequiresAdditionalInput ? (' ' + contentClassName + '-' + activityCopy.entities[0].node_type) : '';
                let has_video = false;
                    //check if entities has video attached
                    for (const i of activityCopy.entities){
                        if (i.node_type === 'video'){
                            console.log("has video")
                            has_video = true;
        
                        }
                    }
        
                    if(has_video == true){
                        let lastMessageClass = ' ';
                        if (this.props.format.fullscreen && !this.props.inputEnabled) {
                            lastMessageClass += 'wc-fullscreen-last-message';
                        } else if (!this.props.format.fullscreen && !this.props.inputEnabled) {
                            lastMessageClass += 'wc-non-fullscreeen-last-message';
                        }
                        return (
                            <div data-activity-id={activity.id } className={wrapperClassName + lastMessageClass}>
                                <div className={'wc-message wc-message-from-bot-video wc-message-' + 'video' + (this.props.format.fullscreen ? ' wc-node-fullscreen' : '')} ref={ div => this.messageDiv = div }>
                                    <div className={ contentClassName + ' wc-message-content-video' + ' ' + contentClassName + '-node' }>
                                        <VideoCard props={this.props} activity={activityCopy} />
                                    </div>
                                </div>
                            </div>
                        );
        
                    }

            }

           

        }
       

    }
    /**
     * In cases of having a date picker/custom interaction cmp., this
     * method will handle rendering the additional cmp.
     */
    renderAdditionalActivity(contentClassName: string, wrapperClassName: string) {
        const { lastMessage, activity, doCardAction } = this.props;
        const activityCopy: any = activity;
        // Entities is an array for some reason
        const activityRequiresAdditionalInput = activityCopy.entities && activityCopy.entities.length > 0 && activityCopy.entities[0].node_type !== null;

        const activityActions = activityCopy.suggestedActions;
        // Check if there are suggessted acctions in the activity
        const activityHasSuggestedActions = activityActions && activityActions.actions && activityActions.actions.length > 0;

        const contactClassName = activityRequiresAdditionalInput ? (' ' + contentClassName + '-' + activityCopy.entities[0].node_type) : '';

        // Check if there's an additional activity to render to get the user's input
        if (lastMessage && (activityRequiresAdditionalInput || activityHasSuggestedActions)) {
            let nodeType = '';
            if (activityRequiresAdditionalInput && (!activityHasSuggestedActions || activityCopy.entities[0].node_type === 'disclaimer')) {
                nodeType = activityCopy.entities[0].node_type;
            } else if (activityHasSuggestedActions) {
                nodeType = activityActions.actions[0].type;
            }

            


           

            if (nodeType === 'date' || nodeType === 'handoff' || nodeType === 'download' || nodeType === 'esign' || nodeType === 'file' || nodeType === 'imBack' || nodeType === 'contact' || nodeType === 'address' || nodeType === 'disclaimer') {
                let lastMessageClass = ' ';
                if (this.props.format.fullscreen && !this.props.inputEnabled) {
                    lastMessageClass += 'wc-fullscreen-last-message';
                } else if (!this.props.format.fullscreen && !this.props.inputEnabled) {
                    lastMessageClass += 'wc-non-fullscreeen-last-message';
                }
                return (
                    <div data-activity-id={activity.id } className={wrapperClassName + lastMessageClass}>
                        <div className={'wc-message wc-message-from-me wc-message-node wc-message-' + nodeType + (this.props.format.fullscreen ? ' wc-node-fullscreen' : '')} ref={ div => this.messageDiv = div }>
                            <div className={ contentClassName + contactClassName + ' ' + contentClassName + '-node' }>
                                <ActivityView
                                    format={this.props.format}
                                    size={null}
                                    type={nodeType}
                                    activity={activity}
                                    onCardAction={ (type: CardActionTypes, value: string | object) => doCardAction(type, value) }
                                    onImageLoad={null}
                                    gid={this.props.gid}
                                    directLine={this.props.directLine}
                                    addFilesToState={this.props.addFilesToState}
                                    index={this.props.index}
                                />
                            </div>
                        </div>
                    </div>
                );
            }
        } else if (activityCopy.entities && activityCopy.entities.length > 0 && activityCopy.entities[0].node_type === 'file') {
            let lastMessageClass = ' ';
            if (lastMessage && this.props.format.fullscreen && !this.props.inputEnabled) {
                lastMessageClass += 'wc-fullscreen-last-message';
            } else if (lastMessage && !this.props.format.fullscreen && !this.props.inputEnabled) {
                lastMessageClass += 'wc-non-fullscreeen-last-message';
            }
            return (
                <div data-activity-id={activity.id } className={wrapperClassName + lastMessageClass}>
                    <div className={'wc-message wc-message-from-me wc-message-node wc-message-file' + (this.props.format.fullscreen ? ' wc-node-fullscreen' : '')} ref={ div => this.messageDiv = div }>
                        <div className={ contentClassName + contactClassName + ' ' + contentClassName + '-node' }>
                            <FileUploadCardReadOnly files={this.props.files}/>
                        </div>
                    </div>
                </div>
            );
        } else if (activityCopy.entities && activityCopy.entities.length > 0 && activityCopy.entities[0].node_type === 'esign') {
            let lastMessageClass = ' ';
            if (lastMessage && this.props.format.fullscreen && !this.props.inputEnabled) {
                lastMessageClass += 'wc-fullscreen-last-message';
            } else if (lastMessage && !this.props.format.fullscreen && !this.props.inputEnabled) {
                lastMessageClass += 'wc-non-fullscreeen-last-message';
            }
            return (
                <div data-activity-id={activity.id } className={wrapperClassName + lastMessageClass}>
                    <div className={'wc-message wc-message-from-me wc-message-node wc-message-file' + (this.props.format.fullscreen ? ' wc-node-fullscreen' : '')} ref={ div => this.messageDiv = div }>
                        <div className={ contentClassName + contactClassName + ' ' + contentClassName + '-node' }>
                           <EsignCardReadOnly files={this.props.files} post_message={activityCopy.entities[0].part2_message} post_meta={activityCopy.entities[0].part2_meta} pre_message={activityCopy.entities[0].message} pre_meta={activityCopy.entities[0].meta} fullscreen={this.props.format.fullscreen } fullheight={this.props.format.fullHeight }/>
                        </div>
                    </div>
                </div>
            );
        } else if (activityCopy.entities && activityCopy.entities.length > 0 && activityCopy.entities[0].node_type === 'disclaimer') {
            //console.log("in else if statement")
            //console.log(activityCopy.text)
            //console.log(activityCopy)
            if(activityCopy.from && !activity.from.name && activityCopy.from.id == ""){
               // console.log("from user")
               let lastMessageClass = ' ';
               if (lastMessage && this.props.format.fullscreen && !this.props.inputEnabled) {
                   lastMessageClass += 'wc-fullscreen-last-message';
               } else if (lastMessage && !this.props.format.fullscreen && !this.props.inputEnabled) {
                   lastMessageClass += 'wc-non-fullscreeen-last-message';
               }
               return (
                   <div data-activity-id={activity.id } className={wrapperClassName + lastMessageClass}>
                       <div className={'wc-message wc-message-from-me wc-message-node wc-message-disclaimer' + (this.props.format.fullscreen ? ' wc-node-fullscreen' : '')} ref={ div => this.messageDiv = div }>
                           <div className={ contentClassName + contactClassName + ' ' + contentClassName + '-node' }>
                               <DisclaimerCardReadOnly text={activityCopy.text}/>
                           </div>
                       </div>
                   </div>
               );
            } else if(activityCopy.from && activity.from.name) {
                let lastMessageClass = ' ';
                if (lastMessage && this.props.format.fullscreen && !this.props.inputEnabled) {
                    lastMessageClass += 'wc-fullscreen-last-message';
                } else if (lastMessage && !this.props.format.fullscreen && !this.props.inputEnabled) {
                    lastMessageClass += 'wc-non-fullscreeen-last-message';
                }
                return (
                    <div data-activity-id={activity.id } className={wrapperClassName + lastMessageClass}>
                        <div className={'wc-message wc-message-from-me wc-message-node wc-message-disclaimer' + (this.props.format.fullscreen ? ' wc-node-fullscreen' : '')} ref={ div => this.messageDiv = div }>
                            <div className={ contentClassName + contactClassName + ' ' + contentClassName + '-node' }>
                                <DisclaimerCardReadOnly text={activityCopy.text}/>
                            </div>
                        </div>
                    </div>
                );
            }
        } else if (activityCopy.entities && activityCopy.entities.length > 0 && activityCopy.entities[0].node_type === 'download'){
            //docassembe card case
            console.log("hit docassemble")
            let lastMessageClass = ' ';
            if (lastMessage && this.props.format.fullscreen && !this.props.inputEnabled) {
                lastMessageClass += 'wc-fullscreen-last-message';
            } else if (lastMessage && !this.props.format.fullscreen && !this.props.inputEnabled) {
                lastMessageClass += 'wc-non-fullscreeen-last-message';
            }
            return (
                <div data-activity-id={activity.id } className={wrapperClassName + lastMessageClass}>
                    <div className={'wc-message wc-message-from-me wc-message-node wc-message-file' + (this.props.format.fullscreen ? ' wc-node-fullscreen' : '')} ref={ div => this.messageDiv = div }>
                        <div className={ contentClassName + contactClassName + ' ' + contentClassName + '-node' }>
                           <DocassembleCard files={activityCopy.entities[0].pdf_link} post_message={activityCopy.entities[0].meta} fullscreen={this.props.format.fullscreen } fullheight={this.props.format.fullHeight } file_format={activityCopy.entities[0].file_format}/>
                        </div>
                    </div>
                </div>
            );
        }
    }

    render() {
        let timeLine: JSX.Element;

        const { activity, format } = this.props;

        // These lines determine the type of node. If it is a date node, we need to set overflow to visible to wrapper class
        const activityCopy: any = activity;
        const activityEntities = activityCopy.entities;
        let nodeType = '';
        if (activityEntities && activityEntities.length > 0) {
            nodeType = activityEntities[0].node_type;
        }

        switch (activity.id) {
            case undefined:
                timeLine = <span>{ format.strings.messageSending }</span>;
                break;
            case null:
                timeLine = <span>{ format.strings.messageFailed }</span>;
                break;
            case 'retry':
                timeLine =
                    <span>
                        { format.strings.messageFailed }
                        { ' ' }
                        <a href="." onClick={ this.props.onClickRetry }>{ format.strings.messageRetry }</a>
                    </span>;
                break;
            default:
                let sent: string;
                if (this.props.showTimestamp) {
                    sent = format.strings.timeSent.replace('%1', (new Date(activity.timestamp)).toLocaleTimeString());
                }
                timeLine = <span>{ activity.from.name || activity.from.id }{ sent }</span>;
                break;
        }

        const who = this.props.fromMe ? 'me' : 'bot';

        const wrapperClassName = classList(
            'wc-message-wrapper',
            (nodeType === 'date') && 'wc-message-wrapper-overflow-visible',
            (this.props.activity as Message).attachmentLayout || 'list',
            this.props.onClickActivity && 'clickable',
            who
        );

        const contentClassName = classList(
            'wc-message-content',
            this.props.selected && 'selected'
        );

        const avatarColor = this.props.format && this.props.format.themeColor ? this.props.format.themeColor : '#c3ccd0';
        const avatarInitial = this.props.format && this.props.format.display_name && typeof(this.props.format.display_name) === 'string' ? findInitial(this.props.format.display_name) : 'B';
        const showAvatar = this.props.fromMe === false && (this.props.nextActivityFromMe || this.props.lastMessage);

        if (this.props.activity.type === 'message' && who === 'me' && (this.props.activity.text.includes('Skip Upload') || this.props.activity.text.includes('s3.amazonaws') || this.props.activity.text.length <= 0)) {
            return (
                <div className={`wc-message-pane from-me-blank`}
                  >
                    {(this.props.displayName && <span className="wc-message-bot-name">{this.props.format && this.props.format.display_name ? this.props.format.display_name : 'Bot'}</span>)}
                    <div data-activity-id={ this.props.activity.id } className={ wrapperClassName } onClick={ this.props.onClickActivity }>
                        {!this.props.fromMe && (showAvatar ?
                          <div className="wc-message-avatar" style={{ background: avatarColor }}>{avatarInitial}</div>
                        :
                          <div className="wc-message-avatar blank"/>
                        )}
                        <div className={ 'wc-message wc-message-from-me-blank' } ref={ div => this.messageDiv = div }>
                        </div>
                        {/* <div className={ 'wc-message-from wc-message-from-' + who }>{ timeLine }</div> */}
                    </div>
                    {this.renderAdditionalActivity(contentClassName, wrapperClassName)}
                </div>
            );
        }

        if (who !== 'me' && nodeType === 'disclaimer') {
            return this.renderAdditionalActivity(contentClassName, wrapperClassName);
        }

        return (
            <div className={`wc-message-pane from-${who}`}
              >
                {(this.props.displayName && <span className="wc-message-bot-name">{this.props.format && this.props.format.display_name ? this.props.format.display_name : 'Bot'}</span>)}
                <div data-activity-id={ this.props.activity.id } className={ wrapperClassName } onClick={ this.props.onClickActivity }>
                    {!this.props.fromMe && (showAvatar ?
                      <div className="wc-message-avatar" style={{ background: avatarColor }}>{avatarInitial}</div>
                    :
                      <div className="wc-message-avatar blank"/>
                    )}
                    <div className={ 'wc-message wc-message-from-' + who } ref={ div => this.messageDiv = div }>
                        <div className={ contentClassName }>
                            {/* <svg className="wc-message-callout">
                                <path className="point-left" d="m0,6 l6 6 v-12 z" />
                                <path className="point-right" d="m6,6 l-6 6 v-12 z" />
                            </svg> */}
                            { this.props.children }
                        </div>
                    </div>

                    {/* <div className={ 'wc-message-from wc-message-from-' + who }>{ timeLine }</div> */}
                </div>

                {this.videoCheck(contentClassName, wrapperClassName)}
                {this.renderAdditionalActivity(contentClassName, wrapperClassName)}
                {}
            </div>
        );
    }
}
