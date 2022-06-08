import { Component } from 'react';
import { DirectLineOptions } from 'botframework-directlinejs';


export interface NodeElements {
    node_type: string;
}


// PROPS NOT INCLUDED IN NodeProps
//
// interface DatePickerProps {
//     submitDate: () => any;
//     selectDate: (date: moment.Moment) => any;
// }

// interface DisclaimerProps {
//     activityWithSuggestedActions: Message;
//     // activityWithDateAndTimePicker: Message;
//     text: string;
  
//     takeSuggestedAction: (message: Message) => any;
//     chooseOption: (placeholder: string) => any;
//     resetShellInput: () => any;
  
//     children: React.ReactNode;
//     doCardAction: IDoCardAction;
  
//     onImageLoad: () => void;
// }

// interface FileUploadProps {
//     fileSelected: (inputStatus: boolean) => void;
//     sendFiles: (files: FileList) => void;
//     inputDisabled: boolean;
    
//     index: number;
//     addFilesToState: (index: number, files: Array<{ name: string, url: string }>) => void;
// }

export interface NodeProps {
    node: NodeElements;
    directLine?: DirectLineOptions;
    sendMessage: (inputText: string) => void;
    updateInput: (disabled: boolean, placeholder: string) => void;
    gid: string;
    conversationId: string;
    withTime: boolean;
}

export abstract class AbstractNode extends Component<NodeProps, {}> {
    constructor(props: NodeProps) {
        super(props);
    }
}