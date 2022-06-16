import * as React from 'react';
import { ErrorProps, NodeError } from './NodeError';
import { NodeTitle, TitleProps } from './NodeTitle';

export interface ContainerProps {
    title?: TitleProps;
    error?: ErrorProps;
    errorOn?: any;      // condition on which the error message is displayed
    content: any;
    nodeType?: string;  // node-specific class to apply (optional)
}

/**
 * A component for adding a standard container to a node
 * This container and its content will have the same styling wherever it is used
 */
export class NodeCustomContainer extends React.Component<ContainerProps, {}> {
    constructor(props: ContainerProps) {
        super(props);
    }

    render() {
        return (
            <div className={'gideon__node__container ' + (this.props.nodeType ? this.props.nodeType + '__container' : '')}>
                {this.props.title && (<NodeTitle
                    {...this.props.title}
                    nodeType={this.props.nodeType}
                />)}

                {this.props.content}

                {this.props.errorOn && (<NodeError
                    {...this.props.error}
                    nodeType={this.props.nodeType}
                />)}

            </div>
        );
    }
}
