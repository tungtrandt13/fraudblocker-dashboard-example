import React from 'react';
import PropTypes from 'prop-types';
import styles from './ResultTable.module.scss';

const FilterSelect = ({ filter, onChange, options }) => {
    return (
        <div className={styles.gridDropdownFilterWrap}>
            <select 
                onChange={(event) => onChange(event.target.value)}
                className={styles.gridDropdownFilter}
                value={filter?.value || 'all'}
            >
                <option value="all">Show All</option>
                {options.map((option) => (
                    <option 
                        key={option.value || option}
                        value={option.value || option}
                    >
                        {option.label || option}
                    </option>
                ))}
            </select>
            <svg 
                className={`MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiNativeSelect-icon MuiNativeSelect-iconStandard ${styles.triangleIcon}`}
                focusable="false"
                aria-hidden="true"
                viewBox="0 0 24 24"
                data-testid="ArrowDropDownIcon"
            >
                <path d="M7 10l5 5 5-5z" />
            </svg>
        </div>
    );
};

FilterSelect.propTypes = {
    filter: PropTypes.shape({
        value: PropTypes.any
    }),
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                value: PropTypes.any,
                label: PropTypes.string
            })
        ])
    ).isRequired
};

const GridDropdownFilter = ({ item, applyValue, options }) => {
    const handleFilterChange = (value) => {
        applyValue({
            ...item,
            value: value === 'all' ? '' : value
        });
    };

    return (
        <FilterSelect 
            filter={item}
            onChange={handleFilterChange}
            options={options}
        />
    );
};

GridDropdownFilter.propTypes = {
    applyValue: PropTypes.func.isRequired,
    item: PropTypes.shape({
        columnField: PropTypes.string,
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        operatorValue: PropTypes.string,
        value: PropTypes.any
    }).isRequired,
    options: PropTypes.array.isRequired
};

export { FilterSelect, GridDropdownFilter };