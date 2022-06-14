import * as React from 'react';

export interface TitleProps {
    title: string;
    required: boolean;  // if true, will display a red asterisk
    nodeType?: string;  // node-specific class to apply (optional)
}

/**
 * Title component to be used in Node Containers
 */
export class NodeTitle extends React.Component<TitleProps, {}> {
    constructor(props: TitleProps) {
        super(props);
    }

    render() {
        return (
            <span className={'node__container__title ' + (this.props.nodeType ? this.props.nodeType + '__container__title' : '')}>
                {this.props.title}

                {this.props.required && (<span className="required">*</span>)}
            </span>
        );
    }
}
