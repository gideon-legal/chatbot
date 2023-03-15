import { DirectLineOptions, Message} from 'botframework-directlinejs';
import * as moment from 'moment';
import * as React from 'react';
import { FaCaretLeft, FaCaretRight } from 'react-icons/fa';
import { connect } from 'react-redux';
import { availableTimes } from './api/bot';
import { NodeHeader } from './nodes/containers/NodeHeader';
import { ChatState } from './Store';
import { ChatActions, sendMessage } from './Store';

export interface Node {
    node_type: string;
    availableTimes: string[];
}

interface SchedulerProps {
    submitDate: () => any;
    selectDate: (date: moment.Moment) => any;
    sendMessage: (inputText: string) => void;
    node: Node;
    gid: string;
    directLine?: DirectLineOptions;
    conversationId: string;
}

export interface MessageWithDate extends Message {
    selectedDate: moment.Moment;
}

export interface SchedulerState {
    date: moment.Moment;
    dateSelected: boolean;
    timeSelected: boolean;
    selectChoice: string;
    includedTimes: moment.Moment[];
    monthAvailabilities: any;
    loading: boolean;
    duration: number;
    previousStartDates: moment.Moment[]; // keep track of start dates in previous 3 day ranges
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
 * Scheduler card which renders in response to 'handoff' nodes
 * Used for date(time) selection
 */
class Scheduler extends React.Component<SchedulerProps, SchedulerState> {
    constructor(props: SchedulerProps) {
        super(props);

        this.state = {
            date: null,
            dateSelected: false,
            timeSelected: false,
            selectChoice: 'startDate',
            includedTimes: [],
            monthAvailabilities: null,
            loading: true,
            duration: 30,
            previousStartDates: []
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

        const dateAvailabilitySelected = changeExcludeTime && this.state.date;
        this.setState({loading: true});
        availableTimes(gid, directLine.secret, conversationId, startDate)
            .then((res: any) => {
              
                const allAvailabilities = this.mapAvailabilitiesDateWise(res.data);
                
                let getAvailForDate = date;

                if (!changeExcludeTime && (this.state.date && this.state.date.month() === date.month())) {
                  
                    getAvailForDate = this.state.date;
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
                    date: dateAvailabilitySelected ? date : this.state.date,
                    // dateSelected: dateAvailabilitySelected ? true : this.state.dateSelected,
                    monthAvailabilities: allAvailabilities,
                    includedTimes: includedTime,
                    loading: false,
                    duration: appointmentDuration,
                    previousStartDates: updatedPreviousStartDates || this.state.previousStartDates
                });
        })
        .catch((err: any) => {
            this.setState({
                date: dateAvailabilitySelected ? date : this.state.date,
                dateSelected: dateAvailabilitySelected ? true : this.state.dateSelected,
                loading: false
            });
        });
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
     * @param newDate
     */
    handleDateChange(event: React.SyntheticEvent<any>, newDate: moment.Moment, withTime: boolean) {
        const { node } = this.props;

        const isHandoff = node.node_type === 'handoff';
        // event check is a hack that works for date and handoff
        // date node will be reworked, so don't want to spend time on this
        const timeSelected = isHandoff ? withTime : event === undefined;
        if (this.state.monthAvailabilities) {
            const includedTime = getIncludedTimes(this.state.monthAvailabilities[newDate.format('YYYY-MM-DD')], this.state.duration, newDate);
            this.setState({
                date: newDate,
                includedTimes: includedTime ? includedTime : [],
                timeSelected
            });
        } else {
            this.setState({
                date: newDate,
                timeSelected
            });
        }
    }

    handleDaySubmit() {
      this.setState({
        dateSelected: true
      });
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
      //need to convert to include label
      const d = new Date(Date.now())
      const timezone = d.toLocaleDateString("en-US", { day: '2-digit', timeZoneName: 'short'}).split(',')[1]
      return this.state.date.format(dateFormatWithTime) + timezone;
    }

    validateSelection = () => {
        const { dateSelected, timeSelected } = this.state;
        return dateSelected && timeSelected;
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

    renderDayPicker = () => {
      const keys = this.state.monthAvailabilities ? Object.keys(this.state.monthAvailabilities).sort((a, b) => Date.parse(a) - Date.parse(b)) : [];
      const startDate = this.state.monthAvailabilities ? moment(keys[0]) : undefined;
      let endDate: moment.Moment;
      keys.forEach(key => {
        if (this.state.monthAvailabilities[key].length > 0) {

          endDate = moment(key);
        }
      });

      return (
        <div className="gd-date-picker-inner-container">
          <div className="gd-date-picker-select-header">
            <span>Select a Day</span>
            <span>{this.getUsersTimeZone()}</span>
          </div>
          <div className="gd-date-picker-days-container">
          {this.state.monthAvailabilities && !this.state.loading &&
            keys.map(date =>
              this.availabilitiesExistOnDay(date) && <button
                className={`gd-date-picker-select-day ${moment(date).isSame(this.state.date) && 'selected-day'}`}
                onClick={e => this.handleDateChange(undefined, moment(date), false)}
                key={date}
              >
                {moment(date).format('dddd MMMM Do, YYYY')}
              </button>
            )}
            {this.state.loading &&
              <div className="gd-date-picker-loading-container">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="45"/>
                </svg>
              </div>
            }
            </div>
            <div className="gd-date-picker-navigation">
              {startDate > moment() && <FaCaretLeft
                className="gd-date-picker-prev"
                onClick={(e: React.MouseEvent<SVGElement>) => this.getAvailableTimes(this.state.previousStartDates[this.state.previousStartDates.length - 2], true)}
              />}

              <FaCaretRight
                className="gd-date-picker-next"
                onClick={(e: React.MouseEvent<SVGElement>) => this.getAvailableTimes(endDate.add(1, 'days'), true)}
              />
            </div>
            <div>
                <button type="button" className="gideon-submit-button" onClick={() => this.handleDaySubmit()} title="Submit">
                    Select
                </button>
            </div>
        </div>

      );
    }

    renderHourPicker = () => {
      const { includedTimes, date, timeSelected } = this.state;

      return (
        <div className="gd-date-picker-inner-container gd-date-picker-inner-container-hours">
          <div className="gd-date-picker-inner-header">
            <div
              className="gd-date-picker-hours-back"
            >
              <FaCaretLeft onClick={(e: React.MouseEvent<SVGElement>) => this.setState({
                ...this.state,
                dateSelected: false,
                timeSelected: false,
                date: null
              })}/>
            </div>
            <span className="gd-date-picker-inner-header-selected-day">{timeSelected ? date.format('MM/DD/YYYY hh:mm A') : date.format('MM/DD/YYYY')}</span>
          </div>
          <div className="gd-date-picker-select-header">
            <span>Select a Time</span>
            <span>{this.getUsersTimeZone()}</span>
          </div>
          <div className="gd-date-picker-hours-container">
            {includedTimes.map(time =>
              <button
                className="gd-date-picker-select-hour"
                key={time.format('hh:mm A')}
                onClick={e => {
                  this.handleDateChange(undefined, moment(date.format('DD MMM YYYY') + ' ' + time.format('hh:mm A')), true);
                }}
              >{time.format('hh:mm A')}</button>
            )}
          </div>
          <div>
            <button type="button" className="gideon-submit-button" onClick={e => this.clickToSubmitDate(e) } title="Submit" style={{marginTop: '15px'}}>
                Schedule
            </button>
          </div>
        </div>
      );
    }

    render() {
        const { loading, dateSelected, duration } = this.state;

        return (
            <div className={`gd-date-picker withTime gideon__node`}>
                <NodeHeader
                header="Schedule Appointment"
                />
                {!dateSelected && this.renderDayPicker()}
                {dateSelected && this.renderHourPicker()}
            </div>
        );
    }
}

export const SchedulerCard = connect(
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
    }, (stateProps: any, dispatchProps: any, ownProps: any): SchedulerProps => {
        return {
            // from stateProps
            node: ownProps.node,
            // from dispatchProps
            selectDate: dispatchProps.selectDate,
            submitDate: dispatchProps.submitDate,
            sendMessage: (text: string) => dispatchProps.sendMessage(text, stateProps.user, stateProps.locale),
            gid: ownProps.gid,
            directLine: ownProps.directLine,
            conversationId: stateProps.conversationId
        };
    }
)(Scheduler);
