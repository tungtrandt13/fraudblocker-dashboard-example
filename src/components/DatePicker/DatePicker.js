import React, { PureComponent } from "react";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { AdapterMoment } from "@mui/x-date-pickers-pro/AdapterMoment";
import "./react_dates_overrides.css";
import PropTypes from "prop-types";
import moment from "moment";
import { LocalizationProvider } from "@mui/x-date-pickers-pro";

class DatePicker extends PureComponent {
    state = {
        dateValues: [this.props.startDate, this.props.endDate]
    };

    onConfirm = (val) => {
        this.setState({
            dateValues: val
        });
        this.props.onDatesChange(val[0], val[1]);
    };

    onFocus = (focusedInput) => {
        const { onFocusChange } = this.props;
        onFocusChange(focusedInput);
    };

    componentDidUpdate = () => {
        if (this.state.dateValues[0] !== this.props.startDate || this.state.dateValues[1] !== this.props.endDate) {
            setTimeout(() => {
                this.setState({
                    dateValues: [this.props.startDate, this.props.endDate],
                });
            }, 100);
        }
    };

    checkIfOutOfRange = (currentDate, position) => {
        return (
            (position === "start" && moment().diff(moment(currentDate), "days") > 95) ||
            (position === "end" && moment(currentDate).diff(this.state.dateValues[0], "days") > 95)
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
                    <label className="label startDateLabel"> Start Date </label>{" "}
                    <label className="label endDateLabel"> End Date </label>{" "}
                </div>{" "}
                <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DateRangePicker
                        value={dateValues}
                        // onChange={newValue => this.onDateChange(newValue)}
                        format="MMMM D, YYYY"
                        onAccept={this.onConfirm}
                        closeOnSelect={false}
                        onOpen={this.onOpen}
                        disableFuture={true}
                        slotProps={{
                            textField: {
                                disabled: true,
                                readOnly: true,
                            },
                            field: {
                                readOnly: true,
                            },
                            actionBar: {
                                actions: ["accept", "cancel"],
                            },
                        }}
                        localeText={{
                            start: "",
                            end: "",
                        }}
                        shouldDisableDate={this.checkIfOutOfRange}
                    />{" "}
                </LocalizationProvider>{" "}
            </div>
        );
    }
}

DatePicker.propTypes = {
    startDate: PropTypes.any,
    endDate: PropTypes.any,
    onDatesChange: PropTypes.func.isRequired,
    focusedInput: PropTypes.any,
    onFocusChange: PropTypes.func.isRequired,
};

export default DatePicker;
