import * as React from 'react';

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
        <div>
            <div className="file-upload-title">Files Uploaded</div>
            {this.props.files.map((file: any) => (
                <div className="uploaded-file-name-readonly">
                  <a target="_blank" href={file.url}>{file.name}</a>
                </div>
            ))}
        </div>
    );
  }
}
