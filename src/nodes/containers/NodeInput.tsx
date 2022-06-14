import * as React from 'react';

export interface InputProps {
    type: string;
    placeholder?: string;
    ref?: (input: any) => any;
    autoFocus?: any;
    value?: any;
    onChange?: (e: any) => any;
    onKeyPress?: (e: any) => any;
    ariaLabel?: any;
    ariaLive?: any;
    nodeType?: string;
}

export class NodeInput extends React.Component<InputProps, {}> {
    constructor(props: InputProps) {
        super(props);
    }

    render() {
        return (
            <input
                type={this.props.type}
                className={'node__container__input ' + (this.props.nodeType ? this.props.nodeType + '__container__input' : '')}
                ref={this.props.ref}
                autoFocus={this.props.autoFocus}
                value={this.props.value}
                onChange={this.props.onChange}
                onKeyPress={this.props.onKeyPress}
                placeholder={this.props.placeholder}
                aria-label={this.props.ariaLabel}
                aria-live={this.props.ariaLive}
            />
        );
    }
}
