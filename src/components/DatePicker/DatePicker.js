import React, { PureComponent } from "react";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { AdapterMoment } from "@mui/x-date-pickers-pro/AdapterMoment";
import "./react_dates_overrides.css";
import PropTypes from "prop-types";
import moment from "moment";
import { LocalizationProvider } from "@mui/x-date-pickers";

class DatePicker extends PureComponent {
    state = {
        dateValues: [this.props.startDate, this.props.endDate]
    };

    componentDidUpdate() {
        const { startDate, endDate } = this.props;
        const { dateValues } = this.state;
        
        if (dateValues[0] !== startDate || dateValues[1] !== endDate) {
            setTimeout(() => {
                this.setState({
                    dateValues: [startDate, endDate]
                });
            }, 100);
        }
    }

    onConfirm = (val) => {
        this.setState({ dateValues: val });
        this.props.onDatesChange(val[0], val[1]);
    };

    onFocus = (focusedInput) => {
        this.props.onFocusChange(focusedInput);
    };

    checkIfOutOfRange = (currentDate, position) => {
        const { dateValues } = this.state;
        return (
            (position === "start" && moment().diff(moment(currentDate), "days") > 95) ||
            (position === "end" && moment(currentDate).diff(dateValues[0], "days") > 95)
        );
    };

    onKeyDown = (e) => {
        e.preventDefault();
    };

    render() {
        const { dateValues } = this.state;

        return (
            <div className="DateRangeWrapper">
                <div className="dateLabels">
                    <label className="label startDateLabel">Start Date</label>
                    <label className="label endDateLabel">End Date</label>
                </div>
                
                <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DateRangePicker
                        value={dateValues}
                        format="MMMM D, YYYY"
                        onAccept={this.onConfirm}
                        closeOnSelect={false}
                        disableFuture={true}
                        shouldDisableDate={this.checkIfOutOfRange}
                        slotProps={{
                            textField: {
                                disabled: true,
                                readOnly: true
                            },
                            field: {
                                readOnly: true
                            },
                            actionBar: {
                                actions: ["accept", "cancel"]
                            }
                        }}
                        localeText={{
                            start: "",
                            end: ""
                        }}
                    />
                </LocalizationProvider>
            </div>
        );
    }
}

DatePicker.propTypes = {
    startDate: PropTypes.any,
    endDate: PropTypes.any,
    onDatesChange: PropTypes.func.isRequired,
    focusedInput: PropTypes.any,
    onFocusChange: PropTypes.func.isRequired
};

export default DatePicker;
