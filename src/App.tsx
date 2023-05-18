import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Chat, ChatProps } from './Chat';
import * as konsole from './Konsole';

export type AppProps = ChatProps;

export const App = (props: AppProps, container: HTMLElement) => {    
    //staging old directline and gid convert to new
    if(props.directLine.secret == 'ZJP6I19eoL4.XNQv7aoLuvKka9vvJFFo-ogGImC-ug1X7E6LVzQvxhg') {
        var change_line = 'ur5KmME_YCg.Rmtqpc5rri2FI0ZWHaBUDaCLsoLG2cQsP-mH9GeevsE'
        props.directLine.secret = change_line;
        props.gid = "https://staging-api.gideonlegal.net"
    }
    if(props.gid == "https://gideon-dev.herokuapp.com") {
        props.gid = "https://staging-api.gideonlegal.net"
    }
    //prod old directline and gid convert to new
    if(props.directLine.secret == 'GaRM_zwyAjE.cwA.Bfo.n1taE5VMAn6YvZ1UtFDx3p5VFayw9TFfBxa12GIBENA') {
        var change_line = 'GaRM_zwyAjE.cwA.Bfo.n1taE5VMAn6YvZ1UtFDx3p5VFayw9TFfBxa12GIBENA'
        props.directLine.secret = change_line;
        props.gid = "https://api-aws.gideon.legal"
    }
    if(props.gid == "https://gideon-prod.herokuapp.com") {
        props.gid = "https://api-aws.gideon.legal"
    }
    ReactDOM.render(React.createElement(AppContainer, props), container);
};

const AppContainer = (props: AppProps) => {

    return (
        <div className="wc-app">
            <Chat { ...props } />
        </div>
    );
};
