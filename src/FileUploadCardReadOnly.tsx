import * as React from 'react';

export interface Node {
  node_type: string;
  meta: any;
}

export interface FileUploadCardReadOnlyProps {
  filenames: string[];
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
        <div>
            <div className="file-upload-title">Files Uploaded</div>
            {this.props.filenames.map((filename: any) => (
                <div className="uploaded-file-name-readonly">{filename}</div>
            ))}
        </div>
    );
  }
}
