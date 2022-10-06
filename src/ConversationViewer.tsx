import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import ConversationWrapper from './ConversationsWrapper'
import InfiniteScroll from 'react-infinite-scroll-component';

export interface Conversation {
    id: number,
    formatted_message: string,
    created_at: Date,
    updated_at: Date,
    sender_type: string
}

type Props = {
  messages: Conversation[],
  updated_at: Date
};

const ConversationViewer = ({ messages, updated_at }: Props) => {

  const convertDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString("en-us", { year: "2-digit", month: "2-digit", day: "2-digit" });
  }

  const getMessageList = () => {
      console.log('messages from viewer: ', messages)
      return messages.map((m: any, i: any) => {
        const { sender_type, formatted_message } = m;
        let styling;

        if(sender_type === 'bot') {
          styling = {flexDirection:'column', alignItems:'flex-start'} as React.CSSProperties;
        }

        return (
          // !isDuplicateMessage(m, possibleDuplicates, i, firstMessageFromUserIndex) && (
            <li
              key={i}
              className={`leadDetail__conversation__message__wrap leadDetail__conversation__message__wrap--${sender_type}`}
              style={styling}
            >
              {/* if we want bot name above the bot msgs */}
              {/* {sender_type === 'bot' &&
                <div style={{ backgroundColor: 'transparent', padding: '0', paddingLeft: '5px', fontSize:'12px', color:'#cccccc' }}>*insert bot name*</div>
              } */}
              <div>
                <ReactMarkdown children={formatted_message} />
              </div>
            </li>
         // )
        );
      });
  }

  const createTitle = () => {
    const title = messages[0].created_at;
    return title;
  }

  return (
    <ConversationWrapper
        body={
          <div>
            <div className="wc-date-header">
              <div className="wc-date-header-line"></div>
              <div className="wc-date-header-text">{ convertDate(updated_at) }</div>
              <div className="wc-date-header-line"></div>
            </div>
            <ul className="leadDetail__conversation__messages">
              {getMessageList()}
            </ul>
          </div>
        }
      />
  );
};

export default ConversationViewer;
