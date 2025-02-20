import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import styles from './DatesSelector.module.scss';
import DatePicker from '../../components/DatePicker/DatePicker';
import Dropdown from '../../components/Dropdown/Dropdown';
import Constants from '../../utils/Constants';

const customStyles = {
    customDropdown: {
        marginRight: 10
    }
};

class DatesSelector extends PureComponent {
    state = {
        startDate: localStorage.getItem('start_date')
            ? moment(localStorage.getItem('start_date'), 'YYYYMMDD')
            : moment().subtract(3, 'days'),
        endDate: localStorage.getItem('end_date')
            ? moment(localStorage.getItem('end_date'), 'YYYYMMDD')
            : moment(),
        focusedInput: null,
        dateFilter: localStorage.getItem('duration')
            ? Constants.dropdownOptions.values[parseInt(localStorage.getItem('duration'), 10)]
            : Constants.dropdownOptions.values[0]
    };

    onDatesChange = (startDate, endDate, selectedOption) => {
        const { handleDateChange } = this.props;
        
        this.setState({
            startDate,
            endDate,
            dateFilter: selectedOption || Constants.dropdownOptions.values[0]
        });

        if (startDate && endDate !== null) {
            handleDateChange(
                {
                    startDate: moment(startDate).format('YYYYMMDD'),
                    endDate: moment(endDate).format('YYYYMMDD')
                },
                null
            );

            localStorage.setItem('start_date', moment(startDate).format('YYYYMMDD'));
            localStorage.setItem('end_date', moment(endDate).format('YYYYMMDD'));

            if (selectedOption) {
                const index = Constants.dropdownOptions.values.findIndex(
                    item => item.value === selectedOption.value
                );
                localStorage.setItem('duration', index);
            } else {
                localStorage.setItem('duration', 0);
            }
        }
    };

    onFocusChange = input => {
        this.setState({
            focusedInput: input
        });
    };

    onDateFilterChange = selectedOption => {
        this.setState({
            dateFilter: selectedOption
        });

        switch (selectedOption.value) {
            case 'Today':
                this.onDatesChange(moment(), moment(), selectedOption);
                break;

            case 'Last 7 Days':
                this.onDatesChange(
                    moment().subtract(7, 'days'),
                    moment(),
                    selectedOption
                );
                break;

            case 'Last 30 Days':
                this.onDatesChange(
                    moment().subtract(30, 'days'),
                    moment(),
                    selectedOption
                );
                break;

            case 'This Month':
                this.onDatesChange(
                    moment().startOf('month'),
                    moment(),
                    selectedOption
                );
                break;

            case 'Last Month':
                this.onDatesChange(
                    moment().subtract(1, 'month').startOf('month'),
                    moment().subtract(1, 'month').endOf('month'),
                    selectedOption
                );
                break;

            case 'Last 3 Months':
                this.onDatesChange(
                    moment().subtract(3, 'month'),
                    moment(),
                    selectedOption
                );
                break;

            case 'This Year':
                this.onDatesChange(
                    moment().startOf('year'),
                    moment(),
                    selectedOption
                );
                break;

            case 'Last Year':
                this.onDatesChange(
                    moment().subtract(1, 'year').startOf('year'),
                    moment().subtract(1, 'year').endOf('year'),
                    selectedOption
                );
                break;

            case 'All Time':
                this.onDatesChange(
                    moment().subtract(1, 'year').startOf('year'),
                    moment(),
                    selectedOption
                );
                break;

            default:
                break;
        }
    };

    render() {
        const { startDate, endDate, focusedInput, dateFilter } = this.state;

        return (
            <div className={styles.dateContainer}>
                <Dropdown
                    onOptionChange={this.onDateFilterChange}
                    value={dateFilter}
                    options={Constants.dropdownOptions.values}
                    containerStyle={customStyles.customDropdown}
                    selectClass={styles.customDropdown}
                    label="Filter"
                    labelStyle={{
                        fontSize: '12px',
                        color: '#8A8A8A',
                        marginBottom: '5px',
                        fontWeight: 500
                    }}
                />
                <DatePicker
                    startDate={startDate}
                    endDate={endDate}
                    onDatesChange={this.onDatesChange}
                    focusedInput={focusedInput}
                    onFocusChange={this.onFocusChange}
                />
            </div>
        );
    }
}

DatesSelector.propTypes = {
    handleDateChange: PropTypes.func
};

export default DatesSelector;