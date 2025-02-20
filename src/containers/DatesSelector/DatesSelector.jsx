import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import styles from "./DatesSelector.module.scss";
import DatePicker from "../../components/DatePicker/DatePicker"; // Assuming DatePicker is a functional component
import Dropdown from "../../components/Dropdown/Dropdown"; // Assuming Dropdown is a functional component
import Constants from "../../utils/Constants";

const customStyles = {
    customDropdown: {
        marginRight: 10,
    },
};

const DatesSelector = ({ handleDateChange }) => {
    const [startDate, setStartDate] = useState(() =>
        localStorage.getItem("start_date")
            ? moment(localStorage.getItem("start_date"), "YYYYMMDD")
            : moment().subtract(3, "days")
    );
    const [endDate, setEndDate] = useState(() =>
        localStorage.getItem("end_date") ? moment(localStorage.getItem("end_date"), "YYYYMMDD") : moment()
    );
    const [focusedInput, setFocusedInput] = useState(null);
    const [dateFilter, setDateFilter] = useState(() =>
        localStorage.getItem("duration")
            ? Constants.dropdownOptions.values[parseInt(localStorage.getItem("duration"), 10)]
            : Constants.dropdownOptions.values[0]
    );

    const onDatesChange = useCallback(
        (newStartDate, newEndDate, selectedOption) => {
            setStartDate(newStartDate);
            setEndDate(newEndDate);
            setDateFilter(selectedOption || Constants.dropdownOptions.values[0]);

            if (newStartDate && newEndDate !== null) {
                handleDateChange(
                    {
                        startDate: moment(newStartDate).format("YYYYMMDD"),
                        endDate: moment(newEndDate).format("YYYYMMDD"),
                    },
                    null
                );
                localStorage.setItem("start_date", moment(newStartDate).format("YYYYMMDD"));
                localStorage.setItem("end_date", moment(newEndDate).format("YYYYMMDD"));
                if (selectedOption) {
                    const index = Constants.dropdownOptions.values.findIndex(
                        (item) => item.value === selectedOption.value
                    );
                    localStorage.setItem("duration", index);
                } else {
                    localStorage.setItem("duration", 0);
                }
            }
        },
        [handleDateChange]
    ); // Dependency array includes handleDateChange

    const onFocusChange = useCallback((input) => {
        setFocusedInput(input);
    }, []); // Empty dependency array as it doesn't depend on anything from the component scope

    const onDateFilterChange = useCallback(
        (selectedOption) => {
            setDateFilter(selectedOption);
            switch (selectedOption.value) {
                case "Today":
                    onDatesChange(moment(), moment(), selectedOption);
                    break;
                case "Last 7 Days":
                    onDatesChange(moment().subtract(7, "days"), moment(), selectedOption);
                    break;
                case "Last 30 Days":
                    onDatesChange(moment().subtract(30, "days"), moment(), selectedOption);
                    break;
                case "This Month":
                    onDatesChange(moment().startOf("month"), moment(), selectedOption);
                    break;
                case "Last Month":
                    onDatesChange(
                        moment().subtract(1, "month").startOf("month"),
                        moment().subtract(1, "month").endOf("month"),
                        selectedOption
                    );
                    break;
                case "Last 3 Months":
                    onDatesChange(moment().subtract(3, "month"), moment(), selectedOption);
                    break;
                case "This Year":
                    onDatesChange(moment().startOf("year"), moment(), selectedOption);
                    break;
                case "Last Year":
                    onDatesChange(
                        moment().subtract(1, "year").startOf("year"),
                        moment().subtract(1, "year").endOf("year"),
                        selectedOption
                    );
                    break;
                case "All Time":
                    onDatesChange(moment().subtract(1, "year").startOf("year"), moment(), selectedOption);
                    break;
                default:
                    break;
            }
        },
        [onDatesChange]
    ); // Dependency array includes onDatesChange

    return (
        <div className={styles.dateContainer}>
            <Dropdown
                onOptionChange={onDateFilterChange}
                value={dateFilter}
                options={Constants.dropdownOptions.values}
                containerStyle={customStyles.customDropdown}
                selectClass={styles.customDropdown}
                label="Filter"
                labelStyle={{
                    fontSize: "12px",
                    color: "#8A8A8A",
                    marginBottom: "5px",
                    fontWeight: 500,
                }}
            />{" "}
            <DatePicker
                startDate={startDate}
                endDate={endDate}
                onDatesChange={onDatesChange}
                focusedInput={focusedInput}
                onFocusChange={onFocusChange}
            />
        </div>
    );
};

DatesSelector.propTypes = {
    handleDateChange: PropTypes.func,
};

export default DatesSelector;
