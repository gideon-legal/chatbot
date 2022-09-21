import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import ConversationWrapper from './ConversationsWrapper'
import InfiniteScroll from 'react-infinite-scroll-component';

export interface Conversation {
    id: number,
    formatted_message: string,
    created_at: string,
    sender_type: string
}

type Props = {
  messages: Conversation[]
};

const ConversationViewer = ({ messages }: Props) => {

  const handleBackClick = () => {
    // setCurrentConversation(null);
  };

  const getMessageList = () => {
      console.log('get message list')
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
              {sender_type === 'bot' &&
                <div style={{ backgroundColor: 'transparent', padding: '0', paddingLeft: '5px', fontSize:'12px', color:'#cccccc' }}>*insert bot name*</div>
              }
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
              <div className="wc-date-header-text">{ 'MM/DD/YYYY' }</div>
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
