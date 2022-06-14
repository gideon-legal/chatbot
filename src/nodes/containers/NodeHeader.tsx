import * as React from 'react';

export interface HeaderProps {
    header: string;
    nodeType?: string;  // node-specific class to apply (optional)
}

/**
 * A component for adding a standard header to a node
 * This header will have the same styling wherever it is used
 */
export class NodeHeader extends React.Component<HeaderProps, {}> {
    constructor(props: HeaderProps) {
        super(props);
    }

    render() {
        return (
            <div className={'node__header ' + (this.props.nodeType ? this.props.nodeType + '__header' : '')}>
                <b>{this.props.header}</b>
            </div>
        );
    }
}
