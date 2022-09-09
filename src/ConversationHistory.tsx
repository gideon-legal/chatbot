import * as React from 'react';

// import moment from 'moment';

import { Divider, List, ListItem } from '@material-ui/core';
import InfiniteScroll from 'react-infinite-scroll-component';
import ConversationWrapper from "./ConversationsWrapper"
import { conversationHistory } from './api/bot';
import ReactMarkdown from "react-markdown";

export interface HistoryProps {
  getConversations?: any;
  toggleView?: any;
  setCurrentConversation?: any;
}

export interface State {
  convoViewed: any;
}

export class ConversationHistory extends React.Component<HistoryProps, State> {

  private conversations = [{
      updated_at: '11,22,333',
      message_count: 50,
      lead_count: 10
    },
    {
      updated_at: '11,22,333',
      message_count: 50,
      lead_count: 10
    },
    {
      updated_at: '11,22,333',
      message_count: 50,
      lead_count: 10
    },
    {
      updated_at: '11,22,333',
      message_count: 50,
      lead_count: 10
    }
  ];
  // private firstMessageFromUserIndex = messages.findIndex((message) => message.sender_type === "chatbot_user");
  // private possibleDuplicates = [];
  // this.state.convoViewed = undefined;
  
// fetch conversations
// React.useEffect(() => {
//     getConversations(lead.id, 1);
// }, []);

  private loadMore = () => {
    // get more conversations
    // getConversations(lead.id, page + 1, order);
  };

  private handleClickConvo = (conversation: any) => {
    //set state of convo viewer to the key
    console.log("user wants to view ", conversation);
  }

  private conversationListItems = this.conversations.map((conversation, i) => {
    const { updated_at, message_count, lead_count } = conversation;
    if (lead_count) {
      const formattedDate = "10/20/20";
      const time = "12:00AM";
      const conversationComplete = true;
      // const formattedDate = moment(updated_at).format('MM/DD/YYYY');
      // const time = moment(updated_at).format('h:mm a');
      return (
        <div key={i}>
          <ListItem onClick={this.handleClickConvo(conversation)} className="conversationCard">
            <div className="lato" style={{display: "flex", width: "100%", paddingBottom: "5px"}}>
              <div className="messageCount">{message_count} Messages</div>
              { conversationComplete && 
                <div className='convoComplete'>Complete</div>
              }
              <div className="messageTime" style={{ marginLeft: 'auto', fontSize: 18 }}>{time}</div>
            </div>
            <div style={{display: "flex", width: "100%"}}>
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

  // private isDuplicateMessage = (
  //   { message, sender_type }: Message,
  //   duplicates: string[],
  //   currentIndex: number,
  //   firstMessageFromUserIndex: number
  // ) => {
  //   if (sender_type === "chatbot_user" || currentIndex >= firstMessageFromUserIndex) {
  //     return false;
  //   } else if (sender_type === "bot" && !duplicates.includes(message)) {
  //     duplicates.push(message);
  //     return false;
  //   } else {
  //     return true;
  //   }
  // };

  // private getMessageList = () => {
  //   //fetch messages from specific convo
  //   return messages.map((m, i) => {
  //     return (
  //       !isDuplicateMessage(m, possibleDuplicates, i, firstMessageFromUserIndex) && (
  //         <li
  //           key={i}
  //           className={`leadDetail__conversation__message__wrap leadDetail__conversation__message__wrap--${m.sender_type}`}
  //         >
  //           <div>
  //             <ReactMarkdown source={m.formatted_message} />
  //           </div>
  //         </li>
  //       )
  //     );
  //   });
  // }

  render() {
    return (
      <ConversationWrapper 
        body={ true ? 
            <List disablePadding className="conversationList" id="scrollableList">
              <InfiniteScroll
                dataLength={this.conversationListItems.length}
                next={this.loadMore}
                hasMore={false}
                scrollableTarget="scrollableList"
                loader={
                  <h3 className="loader" key={0}>
                    Loading ...
                  </h3>
                }
              >
                {this.conversationListItems}
              </InfiniteScroll>
            </List>
            :
            // <ul className="leadDetail__conversation__messages" ref={messageRef}>
            //   {this.getMessageList()}
            // </ul>  
            <div></div>       
        }
        // onScroll={}
      >
      </ConversationWrapper>
    );
  }
};

export default ConversationHistory;
