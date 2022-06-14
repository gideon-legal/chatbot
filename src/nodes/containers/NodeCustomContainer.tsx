import * as React from 'react';

export interface ContainerProps {
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
                {this.props.content}
            </div>
        );
    }
}
