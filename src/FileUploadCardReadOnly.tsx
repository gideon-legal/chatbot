import * as React from 'react';
import { NodeHeader } from './nodes/containers/NodeHeader';

export interface Node {
  node_type: string;
  meta: any;
}

export interface FileUploadCardReadOnlyProps {
  files: Array<{ name: string, url: string }>;
}

export class FileUploadCardReadOnly extends React.Component<FileUploadCardReadOnlyProps, {}> {
  constructor(props: FileUploadCardReadOnlyProps) {
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
                {this.props.files.map((file: any) => (
                    <div className="uploaded-file-name-readonly-link">
                      <a target="_blank" href={file.url}>{file.name}</a>
                    </div>
                ))}
              </div>
            : <div>
                <NodeHeader
                  header="File Upload"
                  nodeType="file__upload__card"
                />
                <div className="uploaded-file-name-readonly"><i>File Upload Skipped</i></div>
              </div>
          }
        </div>
    );
  }
}
