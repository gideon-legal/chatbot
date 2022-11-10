import * as React from 'react';
import { Divider, List, ListItem } from '@material-ui/core';
import ConversationWrapper from './ConversationsWrapper'

export interface HistoryProps {
  getConversations?: any;
  toggleView?: any;
  conversations: any[];
  setCurrentConversation?: (convo: any) => void;

}

export interface State {
  currentConversationID: string,
  nonEmptyConvos: number
}

export class ConversationHistory extends React.Component<HistoryProps, State> {

  static initialState = {
    currentConversationID : '',
    nonEmptyConvos: 0
  }

  state = ConversationHistory.initialState;

  private handleClickConvo = (conversation: any) => {
    // set state of convo viewer to the key
    console.log('user wants to view ', conversation);
    this.props.setCurrentConversation(conversation);
  }

  private convertDate(date: Date) {
    const d = new Date(date);
    return d.toLocaleString("en-us", { year: "2-digit", month: "2-digit", day: "2-digit" });
  }

  private convertTime(time: Date) {
    const t = new Date(time);
    return t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  private conversationListItems = this.props.conversations.map((conversation, i) => {
    let { updated_at, message_count, lead_count, is_complete } = conversation;
    if (lead_count) {
      const formattedDate = this.convertDate(updated_at);
      const time = this.convertTime(updated_at);
      const conversationComplete = is_complete ? true : false;

      return (
        <div key={i}>
          <ListItem onClick={() => this.handleClickConvo(conversation)} className="conversationCard">
            <div className="lato" style={{display: 'flex', width: '100%', paddingBottom: '5px'}}>
              <div className="messageCount">{message_count} Messages</div>
              { conversationComplete &&
                <div className="convoComplete">Complete</div>
              }
              <div className="messageTime" style={{ marginLeft: 'auto', fontSize: 18 }}>{time}</div>
            </div>
            <div style={{display: 'flex', width: '100%'}}>
              <div>{lead_count} Lead Messages</div>
              <div style={{ marginLeft: 'auto' }}>{formattedDate}</div>
            </div>
          </ListItem>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Divider component="li" />
          </div>
        </div>
      );
    } else {
      return;
    }
  });

  render() {
    return (
      <ConversationWrapper
        body={
          this.conversationListItems[0] !== undefined || this.conversationListItems.length > 2 ?
            <List disablePadding style={{ overflowY: "scroll", height: "inherit" }}>            
                {this.conversationListItems}
            </List>
            :
            <div style={{ textAlign: "center", paddingTop: "30px" }}>No past conversations yet.</div>
        }
      >
      </ConversationWrapper>
    );
  }
};

export default ConversationHistory;
