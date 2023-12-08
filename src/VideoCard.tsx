import * as React from 'react';
import { FormattedText } from './FormattedText';
import { NodeHeader } from './nodes/containers/NodeHeader';

export interface Node {
  node_type: string;
  meta: any;
}

export interface VideoCardProps {
  text: string;
  video_url: string; //for now have video as string
}

export interface VideoCardState {
  isFullscreen: boolean;
  isSidebar: boolean;
}

//NOTE - handling of fullscreen and sidebar version requires options checks?
//DESIGN NOTE - plain card w/ no text, just color matched header. ability to fullscreen video + account for mobile ver
export class VideoCard extends React.Component<VideoCardProps, VideoCardState> {
  constructor(props: VideoCardProps) {
    super(props);

    //this.state = {
   //   // have checks for fullscreen and/or sidebar video
   // };
  }

  render() {
    return (
      <div>
        <div className="video__card gideon__node">
          <NodeHeader
            header="Video"
            nodeType="video__card"
          />
         
          
        </div>
      </div>
    );
  }
}