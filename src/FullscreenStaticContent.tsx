import * as React from 'react';

export interface FullscreenStaticContentProps {
    imageUrl?: string;
}

export class FullscreenStaticContent extends React.Component<FullscreenStaticContentProps, {}> {
    constructor(props: FullscreenStaticContentProps) {
        super(props);
    }

    render() {
        const imageSrc = this.props.imageUrl ? this.props.imageUrl : 'https://s3.amazonaws.com/com.gideon.static.dev/chatbot-header-default-v1.1.2.png';
        const containerStyle = this.props.imageUrl
            ? {
                backgroundImage : `url(${this.props.imageUrl})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover'
            }
            : {};
        return (
            <div className="wc-chatbot-content-left-wrap" style={containerStyle}>
                {/* <img
                    className="wc-fullscreen-logo"
                    src={this.props.imageUrl ?
                        this.props.imageUrl :
                        'https://s3.amazonaws.com/com.gideon.static.dev/chatbot-header-default-v1.1.2.png'
                    }
                /> */}
            </div>
        );
    }
}
