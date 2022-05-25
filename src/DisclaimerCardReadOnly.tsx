import * as React from 'react';
import { FormattedText } from './FormattedText';

export interface Node {
  node_type: string;
  meta: any;
}

export interface DisclaimerCardReadOnlyProps {
  text: string;
}

export interface DisclaimerCardReadOnlyState {
  showDisclaimer: boolean;
}

export class DisclaimerCardReadOnly extends React.Component<DisclaimerCardReadOnlyProps, DisclaimerCardReadOnlyState> {
  constructor(props: DisclaimerCardReadOnlyProps) {
    super(props);

    this.state = {
      showDisclaimer: false
    };
  }

  render() {
    const buttonStyle = { ...(!this.state.showDisclaimer && { marginTop: '30px' })};

    return (
      <div>
        <div className="disclaimer__card">
          <div className="disclaimer__card__title">Disclaimer</div>
          {this.state.showDisclaimer &&
            <div className="disclaimer__card__message">
              <FormattedText
                text={ this.props.text }
                format={ 'markdown' }
                onImageLoad={null}
              />
            </div>
          }
          <div className="disclaimer__card__buttons">
            <ul>
              <button style={ buttonStyle } type="button" onClick={ e => this.setState({ showDisclaimer: !this.state.showDisclaimer }) }> { !this.state.showDisclaimer ? 'Review Disclaimer' : 'Close Disclaimer' }</button>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}
