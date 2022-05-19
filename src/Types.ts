import { Activity } from 'botframework-directlinejs';

export interface FormatOptions {
    showHeader?: boolean; // DEPRECATED: Use "title" instead
    bottomOffset?: number;
    topOffset?: number;
    leftOffset?: number;
    rightOffset?: number;
    fullHeight?: boolean;
    fullscreen?: boolean;
    display_name?: string;
    alignment?: string;
    widgetUrl?: string;
    widgetSameAsLogo: boolean;
}

export interface ActivityOrID {
    activity?: Activity;
    id?: string;
}
