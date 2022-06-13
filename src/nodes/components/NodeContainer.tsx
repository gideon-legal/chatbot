import * as React from 'react';
import { ErrorProps, NodeError } from './NodeError';
import { InputProps, NodeInput } from './NodeInput';
import { NodeTitle, TitleProps } from './NodeTitle';

export interface ContainerProps {
    input: InputProps;
    title: TitleProps;
    error: ErrorProps;
    errorOn: any;
    nodeType?: string;
}

export class NodeContainer extends React.Component<ContainerProps, {}> {
    constructor(props: ContainerProps) {
        super(props);
    }

    render() {
        return (
            <div className={'node__container ' + (this.props.nodeType ? this.props.nodeType + '__container' : '')}>
                <NodeTitle
                    {...this.props.title}
                    nodeType={this.props.nodeType}
                />

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
