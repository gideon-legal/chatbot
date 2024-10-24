import { Activity, CardAction, DirectLineOptions, Message} from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import ReactDatePicker from 'react-datepicker';
import { FaCaretLeft } from 'react-icons/fa';
import { connect } from 'react-redux';
import { availableTimes } from './api/bot';
import { OpenCalendarIcon } from './assets/icons/DatePickerIcons';
import { NodeHeader } from './nodes/containers/NodeHeader';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';
import {SubmitButton} from './SubmitButton';

export interface Node {
    node_type: string;
    availableTimes: string[];
    custom_attributes: string[];
    options: string[];
}

interface DatePickerProps {
    submitDate: () => any;
    selectDate: (date: moment.Moment) => any;
    sendMessage: (inputText: string) => void;
    node: Node;
    withTime: boolean;
    gid: string;
    directLine?: DirectLineOptions;
    conversationId: string;
}

export interface MessageWithDate extends Message {
    selectedDate: moment.Moment;
}

export interface DatePickerState {
    startDate: moment.Moment;
    endDate: moment.Moment;
    dateSelected: boolean;
    timeSelected: boolean;
    selectChoice: string;
    showTimeSelectClass: string;
    withRange: boolean;
    withTime: boolean;
    includedTimes: moment.Moment[];
    monthAvailabilities: any;
    loading: boolean;
    duration: number;
    previousStartDates: moment.Moment[]; // keep track of start dates in previous 3 day ranges
    pickerOpen: boolean;
}

export const dateFormat = 'MMMM D, YYYY';
export const dateFormatWithTime = 'MMMM D, YYYY hh:mmA Z';
export const dateFormatWithJustTime = 'MMMM D, YYYY hh:mmA';

const appointmentBuffer = 30; // minutes

/**
 * Getting all the times which are not between the availability times
 */
const getIncludedTimes = (availabilities: any, interval: number, date: moment.Moment) => {
    const periodsInADay = moment.duration(1, 'day').as('minutes');

    const includedTimes = [];
    const startTimeMoment = moment('00:00', 'hh:mm');
    const dateCopy = date.clone().startOf('day');
    for (let i: number = 0; i <= periodsInADay; i += interval) {
        startTimeMoment.add(i === 0 ? 0 : interval, 'minutes');
        dateCopy.add(i === 0 ? 0 : interval, 'minutes');
        const includeTime = availabilities.some((avail: any) => {
            const beforeTime = moment(moment(avail.start_time).format('HH:mm'), 'hh:mm');
            const afterTime = moment(moment(avail.end_time).format('HH:mm'), 'hh:mm');
            const isFuture = dateCopy.isAfter(moment().add(appointmentBuffer, 'minutes'));
            const startTimeCheck = startTimeMoment.isBetween(beforeTime, afterTime, undefined, '[]');
            const endTimeMoment = startTimeMoment.clone().add(interval, 'minutes');
            const endTimeCheck = endTimeMoment.isBetween(beforeTime, afterTime, undefined, '[]');
            return isFuture && startTimeCheck && endTimeCheck;
        });
        if (includeTime) {
          includedTimes.push(startTimeMoment.format('hh:mm A'));
        }
    }

    return includedTimes.map(time => moment(time, 'hh:mm A'));
};

/**
 * Date picker card which renders in response to node of types 'date' and 'handoff'
 * Used for date(time) selection
 */
class DatePicker extends React.Component<DatePickerProps, DatePickerState> {
    constructor(props: DatePickerProps) {
        super(props);

        const isHandoff = this.props.node.node_type === 'handoff';

        this.state = {
            startDate: (isHandoff ? null : moment()),
            endDate: null,
            dateSelected: !isHandoff,
            timeSelected: false,
            selectChoice: (isHandoff ? 'startDate' : 'endDate'),
            withRange: props.node.custom_attributes.includes('range'),
            withTime: props.withTime || props.node.custom_attributes.includes('time') || props.node.node_type === 'handoff',
            showTimeSelectClass: 'hide-time-select',
            includedTimes: [],
            monthAvailabilities: null,
            loading: true,
            duration: 30,
            previousStartDates: [],
            pickerOpen: false
        };

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.clickToSubmitDate = this.clickToSubmitDate.bind(this);
    }

    componentDidMount() {
        this.getAvailableTimes( moment(), true );
    }

    /** Setting the availabilities and excluded times for provide date */
    getAvailableTimes = ( date: moment.Moment, changeExcludeTime: boolean ) => {
        const {
            node,
            gid,
            directLine,
            conversationId
        } = this.props;
        const startDate = date.clone().format('YYYY-MM-DD');

        if (!node) {
            return;
        }
        if (node && node.node_type === 'handoff') {
            const dateAvailabilitySelected = changeExcludeTime && this.state.startDate;
            this.setState({loading: true});
            availableTimes(gid, directLine.secret, conversationId, startDate)
                .then((res: any) => {
                    const allAvailabilities = this.mapAvailabilitiesDateWise(res.data);
                    let getAvailForDate = date;

                    if (!changeExcludeTime && (this.state.startDate && this.state.startDate.month() === date.month())) {
                        getAvailForDate = this.state.startDate;
                    }
                    const minuteString = +res.data.duration.split(':')[1];
                    const hourString = +res.data.duration.split(':')[0];
                    const appointmentDuration = hourString * 60 + minuteString;
                    const includedTime = getIncludedTimes(allAvailabilities[getAvailForDate.format('YYYY-MM-DD')], appointmentDuration, date);

                    const lastStartDate = this.state.previousStartDates.length === 0 ? undefined : this.state.previousStartDates[this.state.previousStartDates.length - 1];

                    let updatedPreviousStartDates: moment.Moment[];
                    if (this.state.previousStartDates.length === 0) {
                        updatedPreviousStartDates = [date];
                    } else {
                        if (lastStartDate < date) {
                            updatedPreviousStartDates = this.state.previousStartDates.concat(date);
                        } else if (lastStartDate > date && this.state.previousStartDates.length > 1) {
                            updatedPreviousStartDates = this.state.previousStartDates.slice(0, -1);
                        }
                    }

                    this.setState({
                        startDate: dateAvailabilitySelected ? date : this.state.startDate,
                        dateSelected: dateAvailabilitySelected ? true : this.state.dateSelected,
                        monthAvailabilities: allAvailabilities,
                        includedTimes: includedTime,
                        loading: false,
                        duration: appointmentDuration,
                        previousStartDates: updatedPreviousStartDates || this.state.previousStartDates
                    });
            })
            .catch((err: any) => {
                this.setState({
                    startDate: dateAvailabilitySelected ? date : this.state.startDate,
                    dateSelected: dateAvailabilitySelected ? true : this.state.dateSelected,
                    loading: false
                });
            });
        }
        return;
    }

    /** Datewise availability array */

    mapAvailabilitiesDateWise = (availabilities: any) => {
        const mergeAvailability = [ ...availabilities.recurring, ...availabilities.single ];
        const dateWiseAvailabilities = mergeAvailability.reduce((nodeAccumulator, avail) => ({
                ...nodeAccumulator,
                [avail.date]: nodeAccumulator[avail.date] && nodeAccumulator[avail.date].length > 0 ? [ ...nodeAccumulator[avail.date], ...avail.availabilities ] : [ ...avail.availabilities ]
        }), {});

        return dateWiseAvailabilities;
     }

    /** Handling the month change */
    handleMonthChange = ( date: moment.Moment ) => {
        this.getAvailableTimes(date, true);
    }

    /**
     * Handles date changing when either selecting a range
     * or just a single date
     * @param date
     */
    handleDateChange(event: React.SyntheticEvent<any>, date: moment.Moment, withTime: boolean) {
        const { withRange, startDate } = this.state;
        const { node } = this.props;

        const isHandoff = node.node_type === 'handoff';
        // event check is a hack that works for date and handoff
        // date node will be reworked, so don't want to spend time on this
        const timeSelected = isHandoff ? withTime : event === undefined;

        if (withRange) {
            if (this.state.selectChoice === 'endDate') {
                return this.setState({
                    selectChoice: 'startDate',
                    endDate: date,
                    dateSelected: true,
                    timeSelected
                    // pickerOpen: false
                });
            }

            this.setState({
                selectChoice: 'endDate',
                startDate: date,
                dateSelected: true,
                timeSelected
            });
        } else {
          this.setState({
              startDate: date,
              dateSelected: true,
              timeSelected
              // pickerOpen: false
          });
        }
    }

    private handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): any {
        if (!this.validateSelection()) { return; }

        if (e.key === 'Enter') {
            this.props.submitDate();
            this.props.sendMessage(this.getDateText());
            document.removeEventListener('keypress', this.handleKeyDown.bind(this));
        }
    }

    getDateText = () => {
        let endDate = '';
        const startDate = this.state.startDate.format(this.state.withTime ? dateFormatWithTime : dateFormat);
        if (this.state.withRange && this.state.endDate) {
             endDate = '~' + this.state.endDate.format(this.state.withTime ? dateFormatWithTime : dateFormat);
        }
        return (startDate + endDate);
    }

    safelyGetDateText = () => {
      let endDate = '';
      const startDate = this.state.startDate ? this.state.startDate.format(this.state.withTime ? dateFormatWithJustTime : dateFormat) : '____';
      if (this.state.withRange) {
           endDate = ' - ';
           const dateAddition = this.state.endDate ? this.state.endDate.format(this.state.withTime ? dateFormatWithJustTime : dateFormat) : '____';
           endDate += dateAddition;
      }
      return (startDate + endDate);
  }

    validateSelection = () => {
        const { node } = this.props;
        const { dateSelected, timeSelected, withTime, withRange, startDate, endDate } = this.state;

        const isHandoff = node.node_type === 'handoff';
        if (isHandoff) {
            return dateSelected && timeSelected;
        } else { // date node
            const rangeValidation = withRange ? startDate && endDate : true;
            const timeValidation = withTime ? timeSelected : true;
            return dateSelected && rangeValidation && timeValidation;
        }
    }

    clickToSubmitDate(e: React.MouseEvent<HTMLButtonElement>) {
        if (!this.validateSelection()) { return; }

        // this.props.submitDate();
        this.props.sendMessage(this.getDateText());

        document.removeEventListener('keypress', this.handleKeyDown.bind(this));

        e.stopPropagation();
    }

    clickNoWorkableAppointment(e: React.MouseEvent<HTMLButtonElement>) {
        this.props.sendMessage('None of these appointments work for me');
        document.removeEventListener('keypress', this.handleKeyDown.bind(this));
        e.stopPropagation();
    }

    availabilitiesExistOnDay = (day: string) => {
      const date = moment(day);
      return date.dayOfYear() >= moment().dayOfYear() && getIncludedTimes(this.state.monthAvailabilities[date.format('YYYY-MM-DD')], this.state.duration, date).length > 0;
    }

    getUsersTimeZone = () => {
      return Intl.DateTimeFormat('en-US', { timeZoneName: 'short'}).format(new Date()).split(' ').pop();
    }

    renderForDateNode = () => {
        const { startDate, endDate, withTime, withRange, timeSelected } = this.state;

        let headerMessage = withRange ? (!startDate ? 'Select a start date' : 'Select an end date') : 'Select a date';
        const dateSelectedCheck = withRange ? startDate && endDate : !!startDate;
        if (withTime && !timeSelected && dateSelectedCheck) {
            headerMessage = 'Select a time';
        }

        if (this.validateSelection()) {
            headerMessage = startDate.format('MMMM D, YYYY');
            if (withRange) {
                headerMessage += ' to ' + endDate.format('MMMM D, YYYY');
            }
        }

        return (
          <div className={`gd-date-picker ${withTime && 'withTime'} date-node gideon__node`}>
            <NodeHeader
              header="Select Date"
            />
            <div className="date-picker-node-content">
              <div className="date-picker-node-content-body">
                {this.state.pickerOpen &&
                  <div className="date-picker-popup-outer-container">
                    {/* <div className="date-picker-popup-container"> */}
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <ReactDatePicker
                          endDate={endDate}
                          startDate={startDate}
                          selected={startDate}
                          onChange={(date, event) =>
                            this.handleDateChange(event, date, withTime)
                          }
                          onMonthChange={e => this.handleMonthChange(e)}
                          inline={true}
                          tabIndex={1}
                          dateFormat={withTime ? dateFormatWithTime : dateFormat}
                          showTimeSelect={withTime}
                          // showMonthDropdown
                          // showYearDropdown
                          dropdownMode="select"
                        />
                      </div>
                    {/* </div> */}
                  </div>
                }

                <div className="date-text-container" onClick={ () => this.setState({ pickerOpen: !this.state.pickerOpen })}>
                  <div className="date-icon"><OpenCalendarIcon /></div>
                  <div className="date-text">{this.safelyGetDateText()}</div>
                </div>
              </div>

              <SubmitButton onClick={e => this.clickToSubmitDate(e) } disabled={ !this.validateSelection() } />
            </div>
          </div>
        );
    }

    render() {
        return this.renderForDateNode();
    }
}

export const DatePickerCard = connect(
    (state: ChatState) => {
        return {
            // passed down to MessagePaneView
            locale: state.format.locale,
            user: state.connection.user,
            conversationId: state.connection.botConnection.conversationId
        };
    }, {
        selectDate: (date: moment.Moment) => ({ type: 'Select_Date', date: date.format('DD MMM YYYY') } as ChatActions),
        // only used to create helper functions below
        sendMessage
    }, (stateProps: any, dispatchProps: any, ownProps: any): DatePickerProps => {
        return {
            // from stateProps
            node: ownProps.node,
            withTime: ownProps.withTime,
            // from dispatchProps
            selectDate: dispatchProps.selectDate,
            submitDate: dispatchProps.submitDate,
            sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
            gid: ownProps.gid,
            directLine: ownProps.directLine,
            conversationId: stateProps.conversationId
        };
    }
)(DatePicker);
