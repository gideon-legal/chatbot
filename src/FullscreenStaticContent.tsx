import * as React from 'react';

export interface FullscreenStaticContentProps {
    imageUrl?: string;
}

export class FullscreenStaticContent extends React.Component<FullscreenStaticContentProps, {}> {
    constructor(props: FullscreenStaticContentProps) {
        super(props);
    }

    render() {
        const containerStyle = this.props.imageUrl
            ? {
                backgroundImage : `url(${this.props.imageUrl})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover'
            }
            : {};
        return (
            <div className="wc-chatbot-content-left-wrap" style={containerStyle}>
                {/* Main content here */}
            </div>
        );
    }
}
