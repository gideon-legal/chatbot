import * as React from 'react';
import { ErrorProps, NodeError } from './NodeError';
import { InputProps, NodeInput } from './NodeInput';
import { NodeTitle, TitleProps } from './NodeTitle';

export interface ContainerProps {
    input: InputProps;
    title?: TitleProps;
    error: ErrorProps;
    errorOn: any;       // condition on which the error message is displayed
    nodeType?: string;  // node-specific class to apply (optional)
}

/**
 * A component for adding a standard input section to a node
 * This container will have the same styling (and classes) wherever it is used
 */
export class NodeInputContainer extends React.Component<ContainerProps, {}> {
    constructor(props: ContainerProps) {
        super(props);
    }

    render() {
        return (
            <div className={'node__container ' + (this.props.nodeType ? this.props.nodeType + '__container' : '')}>
                {this.props.title && (<NodeTitle
                    {...this.props.title}
                    nodeType={this.props.nodeType}
                />)}

                <NodeInput
                    {...this.props.input}
                    nodeType={this.props.nodeType}
                />

                {this.props.errorOn && (<NodeError
                    {...this.props.error}
                    nodeType={this.props.nodeType}
                />)}
            </div>
        );
    }
}
