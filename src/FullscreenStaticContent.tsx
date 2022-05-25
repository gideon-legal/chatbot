import * as React from 'react';

export interface FullscreenStaticContentProps {
    imageUrl?: string;
}

export class FullscreenStaticContent extends React.Component<FullscreenStaticContentProps, {}> {
    constructor(props: FullscreenStaticContentProps) {
        super(props);
    }

    render() {
        return (
            <div className="wc-chatbot-content-left-wrap">
                <img
                    className="wc-fullscreen-logo"
                    src={this.props.imageUrl ?
                        this.props.imageUrl :
                        'https://s3.amazonaws.com/com.gideon.static.dev/chatbot-header-default-v1.1.2.png'
                    }
                />
            </div>
        );
    }
}
