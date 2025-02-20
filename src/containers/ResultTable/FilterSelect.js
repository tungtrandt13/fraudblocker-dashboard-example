import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Select, MenuItem, FormControl, InputLabel, Box } from "@mui/material";
import styles from "./ResultTable.module.scss";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

const FilterSelect = ({ filter, onChange, options }) => {
    const handleChange = useCallback(
        (event) => {
            onChange(event.target.value);
        },
        [onChange]
    );

    return (
        <FormControl fullWidth variant="standard">
            <InputLabel id="filter-select-label">Filter</InputLabel>
            <Select
                labelId="filter-select-label"
                onChange={handleChange}
                className={styles.gridDropdownFilter}
                value={filter?.value || "all"} // Safe access with optional chaining
                IconComponent={ArrowDropDownIcon}
            >
                <MenuItem value="all">Show All</MenuItem>
                {options.map((option) => (
                    <MenuItem key={option.value || option} value={option.value || option}>
                        {option.label || option}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

FilterSelect.propTypes = {
    filter: PropTypes.shape({
        // Define the shape more precisely
        value: PropTypes.any,
    }),
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                value: PropTypes.any.isRequired,
                label: PropTypes.string.isRequired,
            }),
        ])
    ).isRequired,
};

const GridDropdownFilter = ({ applyValue, item, options }) => {
    const handleFilterChange = useCallback(
        (value) => {
            applyValue({ ...item, value: value === "all" ? "" : value });
        },
        [applyValue, item]
    );

    return <FilterSelect filter={item} onChange={handleFilterChange} options={options} />;
};

GridDropdownFilter.propTypes = {
    applyValue: PropTypes.func.isRequired,
    item: PropTypes.shape({
        columnField: PropTypes.string,
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        operatorValue: PropTypes.string,
        value: PropTypes.any,
    }).isRequired,
    options: PropTypes.any,
};

export { GridDropdownFilter, FilterSelect };
