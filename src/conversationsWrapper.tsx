/**
 * Wrapper for the 3 views of the right panel in the lead profile page
 * Exists to ensure uniformity in styling and structure
 */

import { IconButton } from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import * as React from 'react';

export interface WrapperProps {
    body: any;
    backFunction?: React.MouseEventHandler<any>; // run when the back arrow is clicked (if not provided, arrow won't display
    onScroll?: any;
}

class ConversationsWrapper extends React.Component<WrapperProps, {}> {

    render() {
        return (
            <div className="conversation__history">
                <div className="conversation__history__body" onScroll={e => this.props.onScroll ? this.props.onScroll(e) : null}>
                    {this.props.body}
                </div>
            </div>
        );
    }
}

export default ConversationsWrapper;
