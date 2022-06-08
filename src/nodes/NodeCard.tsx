import * as React from 'react';

export interface NodeElements {
    node_type: string;
}

export interface NodeProps {
    // not sure I need any of these really...
    // node: NodeElements;
    // directLine?: DirectLineOptions;
    // sendMessage: (inputText: string) => void;
    // updateInput: (disabled: boolean, placeholder: string) => void;
    // gid: string;
    // conversationId: string;
    // withTime: boolean;
    //
    // probably need this one
    nodeBody: any;
}

export class NodeCard extends React.Component<NodeProps, {}> {
    constructor(props: NodeProps) {
        super(props);
    }

    render() {
        return (
            <div className="node-card">
                {this.props.nodeBody}
            </div>
        );
    }
}
