import * as React from 'react';

export interface ErrorProps {
    message: string;
    nodeType?: string;
}

export class NodeError extends React.Component<ErrorProps, {}> {
    constructor(props: ErrorProps) {
        super(props);
    }

    render() {
        return (
            <span className={'node__container__error ' + (this.props.nodeType ? this.props.nodeType + '__container__error' : '')}>
                {this.props.message}
            </span>
        );
    }
}
