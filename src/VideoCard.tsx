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
import { VideoFullScreenIcon, VideoPlayIcon } from './assets/icons/VideoIcons'
import ReactHlsPlayer from 'react-hls-player';
import { YouTubeEmbed } from 'react-social-media-embed';


//import { useRef } from 'react'

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
  //isFullscreen: boolean;
  //isSidebar: boolean;
  videoPlaying: boolean;  //for play icon
  videoFullscreen: boolean; //for fullscreen icon
}

//NOTE - handling of fullscreen and sidebar version requires options checks?
//DESIGN NOTE - plain card w/ no text, just color matched header. ability to fullscreen video + account for mobile ver
export class Video extends React.Component<VideoProps, VideoState> {
  constructor(props: VideoProps) {
    super(props);
    console.log(props)
    

    this.state = { 
      // have checks for fullscreen and/or sidebar video
      videoPlaying: false,   
      videoFullscreen: false
    };

    console.log(this.state)
  }


  //for onClick of play-pause in vid-controls
  handlePlay(){

  }

  //for onClick of fullscreen in vid-controls
  handleFullscreen(){

  }

  videoTest(){
   // const refCheck = React.useRef();
  }

  //render of video card - using ReactHlsPlayer instead of original <video>
  //package info: https://www.npmjs.com/package/react-hls-player 
  //custom fullscreen and play buttons in vid-controls div - note: controls initially styled using dimensions of <video>
  //                                                               fullscreen and play icons use div and not button due to default styling
  
  render() {

    // need to check if video url is youtube embed or upload - check if contains youtu.be?
    if(this.props.video_url && !this.props.video_url.includes("https://youtu.be") && !this.props.video_url.includes("https://youtube") ){
      console.log("checking vid 2")
    console.log(this.props.video_url)
    const string_vid = (this.props.video_url).toString()
    console.log(string_vid)
      // const video_source = fetch("https://www.youtube.com/watch?v=cytJLvf-eVs")
    return (
      <div>
        <div className="video__card gideon__node">
          <div className='vid-container'>

           
                <ReactHlsPlayer 
                 url={string_vid}
                 autoplay={false}
                 controls={true}
                 width="100%"
                 height="auto"
                  />    
          </div>
        </div>
      </div>
    );

    } else {
      // const video_source = fetch("https://www.youtube.com/watch?v=cytJLvf-eVs")
      console.log("checking vid 3")
    console.log(this.props.video_url)
    var string_vid = this.props.video_url
    var vid_id = ""
    //console.log(string_vid.split("be/"))

    //for .be/ id is between .be/ and ?si
    //need to just get id from link - split different depending on /watch or .be/
    if(this.props.video_url.includes("https://youtu.be")){
      //need to get portion between .be/ and ?si
      vid_id = (string_vid.split('.be/')[1]).split('?si')[0]
      console.log("after split")
      console.log(vid_id)

      
    } else {
      //get portion after v=
      vid_id = string_vid.split('v=')[1];
      console.log("after split")
      console.log(vid_id)
    }

      
    return (
      <div>
        <div className="video__card gideon__node">
          <div className='vid-container'>
    <YouTubeEmbed
    url={this.props.video_url}
    width={325}
    height={320}

    />    
          </div>
        </div>
      </div>
    );

    }
   
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