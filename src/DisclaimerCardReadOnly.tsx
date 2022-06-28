import * as React from 'react';
import { FormattedText } from './FormattedText';
import { NodeHeader } from './nodes/containers/NodeHeader';

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
    return (
      <div>
        <div className="disclaimer__card gideon__node">
          <NodeHeader
            header="Disclaimer"
            nodeType="disclaimer__card"
          />
          {this.state.showDisclaimer &&
            <div className="disclaimer__card__message">
                <div className="disclaimer__card__inner__message">
                  <FormattedText
                    text={ this.props.text }
                    format={ 'markdown' }
                    onImageLoad={null}
                  />
                </div>
            </div>
          }
          <div className="disclaimer__card__buttons">
            <ul>
              <button type="button" onClick={ e => this.setState({ showDisclaimer: !this.state.showDisclaimer }) }> { !this.state.showDisclaimer ? 'Review Disclaimer' : 'Close Disclaimer' }</button>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}
