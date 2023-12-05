import * as React from 'react';
import { FormattedText } from './FormattedText';
import { NodeHeader } from './nodes/containers/NodeHeader';

export interface Node {
  node_type: string;
  meta: any;
}

export interface DisclaimerCardReadOnlyProps {
  text: string;
}

export interface DisclaimerCardReadOnlyState {
  showDisclaimer: boolean;
}

export class DisclaimerCardReadOnly extends React.Component<DisclaimerCardReadOnlyProps, DisclaimerCardReadOnlyState> {
  constructor(props: DisclaimerCardReadOnlyProps) {
    super(props);

    this.state = {
      showDisclaimer: false
    };
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