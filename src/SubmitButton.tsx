import * as React from 'react';

export interface SubmitButtonProps {
  onClick: (e?: any) => void;
}
export interface SubmitButtonState {
  isHovering: boolean;
}

export class SubmitButton extends React.Component<SubmitButtonProps, SubmitButtonState> {
  constructor(props: SubmitButtonProps) {
    super(props);

    this.state = {
      isHovering: false
    };
  }

  private setHover(hover: boolean) {
    this.setState({isHovering: hover});
  }

  render() {
    return (
        <button className="gideon-submit-button" onClick={this.props.onClick} style={{padding: '18px'}} onMouseEnter={() => this.setHover(true)} onMouseLeave={() => this.setHover(false)}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{position: 'relative'}}>
              Submit
              <div style={{position: 'absolute', right: '-36px', top: '0'}}>
                <svg width="17" height="16" viewBox="0 0 17 16" fill={this.state.isHovering ? '#3F6DE1' : '#FEFEFE'} xmlns="http://www.w3.org/2000/svg">
                  <path fill={this.state.isHovering ? '#3F6DE1' : '#FEFEFE'} opacity="0.88" d="M0.992448 15.9999C0.837814 15.9986 0.68479 15.9614 0.546824 15.8911C0.408857 15.8208 0.288907 15.7193 0.196344 15.5946C0.103991 15.4701 0.042695 15.3256 0.0157638 15.1727C-0.0111673 15.0197 -0.00226317 14.8626 0.041977 14.7138L1.77399 8.67008C1.83662 8.68866 1.9019 8.69811 1.96719 8.69812H6.73217C6.91673 8.69812 7.09388 8.62431 7.22439 8.49292C7.3549 8.36152 7.42827 8.18328 7.42827 7.99746C7.42827 7.81163 7.3549 7.63346 7.22439 7.50206C7.09388 7.37066 6.91673 7.29685 6.73217 7.29685H1.96719C1.90191 7.29704 1.83665 7.30643 1.77399 7.32483L0.041977 1.28123C-0.00213433 1.13328 -0.0119688 0.976971 0.014793 0.824867C0.0415547 0.672763 0.103468 0.529099 0.195373 0.405408C0.287454 0.280174 0.407778 0.178327 0.545853 0.10795C0.683928 0.037573 0.836718 0.000581323 0.991477 0C1.13893 0.00118104 1.28401 0.0354079 1.41671 0.10013L16.4281 7.09763C16.6002 7.17898 16.7462 7.30832 16.8475 7.47029C16.9489 7.63227 17.0015 7.8201 17 8.01151C17.0011 8.20116 16.948 8.3871 16.8466 8.54692C16.7452 8.70674 16.5995 8.8336 16.4281 8.91231L1.41671 15.9099C1.28352 15.971 1.13881 16.0017 0.992448 15.9999Z"/>
                </svg>
              </div>
            </div>
          </div>
        </button>
    );
  }
}
