import * as React from 'react';

export interface HeaderProps {
    header: string;
    nodeType?: string;
}

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
