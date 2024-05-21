import * as React from 'react';
import { NodeHeader } from './nodes/containers/NodeHeader';

export interface Node {
  node_type: string;
  meta: any;
}

export interface WelcomeCardReadOnlyProps {
  files: Array<{ name: string, url: string }>;
}

export class WelcomeCardReadOnly extends React.Component<WelcomeCardReadOnlyProps, {}> {
  constructor(props: WelcomeCardReadOnlyProps) {
    super(props);

    this.state = {
      showDisclaimer: false
    };
  }

  render() {
    return (
        <div className="file__upload__card gideon__node">
          {this.props.files.length > 0
            ? <div>
                <NodeHeader
                  header="Files Uploaded"
                  nodeType="file__upload__card"
                />
               
              </div>
            : <div>
                <NodeHeader
                  header="File Upload"
                  nodeType="file__upload__card"
                />
                <div className="uploaded-file-name-readonly"><i>Welcome Card</i></div>
              </div>
          }
        </div>
    );
  }
}