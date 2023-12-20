import * as React from 'react';
import { Activity, CardAction, DirectLine, DirectLineOptions, Message} from 'botframework-directlinejs';
import { FormattedText } from './FormattedText';
import { NodeHeader } from './nodes/containers/NodeHeader';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import { filteredActivities } from './History';
import { connect } from 'react-redux';
import { activityWithSuggestedActions } from './activityWithSuggestedActions';
import { doCardAction, IDoCardAction } from './Chat';

export interface Node {
  node_type: string;
  meta: any;
}

export interface VideoProps {
  sendMessage: (inputText: string) => void;
  video_url: string; //for now have video as string
  gid: any;
  directLine: any,
  conversationId: number,
  prompt: string,

  //fullheight: boolean;
  //fullscreen: boolean;
}

export interface VideoState {
  isFullscreen: boolean;
  isSidebar: boolean;
}

//NOTE - handling of fullscreen and sidebar version requires options checks?
//DESIGN NOTE - plain card w/ no text, just color matched header. ability to fullscreen video + account for mobile ver
export class Video extends React.Component<VideoProps, VideoState> {
  constructor(props: VideoProps) {
    super(props);

    console.log(this.props.video_url)

    //this.state = {
   //   // have checks for fullscreen and/or sidebar video
   // };
  }


  getVideoUrl = () => {


  }

  //just need to display video in card or if for sidebar case, message saying to watch in sidebar
  //for now testing with basic <video> - need to check if controls are editable to have in top part of screen
  render() {
    return (
      <div>
        <div className="video__card">
          

          <video controls>
            <source src={this.props.video_url} type="video/mp4"></source>


          </video>

         
          
        </div>
      </div>
    );
  }
}

export const VideoCard = connect(
    (state: ChatState) => {
        return {
            locale: state.format.locale,
            user: state.connection.user,
            conversationId: state.connection.botConnection.conversationId
        }
    }, {
        sendMessage
    },
     (stateProps: any, dispatchProps: any, ownProps: any): VideoProps => {
        return {
            // from stateProps
            // from dispatchProps
            sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
            gid: ownProps.gid,
            directLine: ownProps.directLine,
            conversationId: stateProps.conversationId,
            prompt: ownProps.text,
           // fullheight: ownProps.format.fullheight,
          //  fullscreen: ownProps.format.fullscreen,
            video_url: ownProps.activity.entities[0].video
        }
    }
)(Video);