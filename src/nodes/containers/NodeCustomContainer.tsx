import * as React from 'react';
import { ErrorProps, NodeError } from './NodeError';
import { NodeTitle, TitleProps } from './NodeTitle';

export interface ContainerProps {
    title?: TitleProps;
    error?: ErrorProps;
    errorOn?: any;
    content: any;
    nodeType?: string;
}

export class NodeCustomContainer extends React.Component<ContainerProps, {}> {
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

                {this.props.content}

                {this.props.errorOn && (<NodeError
                    {...this.props.error}
                    nodeType={this.props.nodeType}
                />)}

            </div>
        );
    }
}
