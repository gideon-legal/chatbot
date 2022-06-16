import * as React from 'react';

export interface ErrorProps {
    message: string;    // error message to be displayed
    nodeType?: string;  // node-specific class to apply (optional)
}

/**
 * Error component to be used in Node Containers
 */
export class NodeError extends React.Component<ErrorProps, {}> {
    constructor(props: ErrorProps) {
        super(props);
    }

    render() {
        return (
            <span className={'gideon__node__container__error ' + (this.props.nodeType ? this.props.nodeType + '__container__error' : '')}>
                {this.props.message}
            </span>
        );
    }
}
