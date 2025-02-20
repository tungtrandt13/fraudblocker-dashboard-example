import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Slider from "@mui/material/Slider";
import styles from "./RangeSlider.module.scss";

const defaultRangeClicksMap = {
    10000: 10000,
    20000: 25000,
    30000: 50000,
    40000: 75000,
    50000: 100000,
};

function RangeSlider({
    disabled = false,
    onInit,
    onUpdate,
    id,
    value,
    handleChange,
    max = 50000,
    min = 10000,
    step = 5000,
    markers = [],
    rangeClicksMap = defaultRangeClicksMap,
}) {
    useEffect(() => {
        if (onInit) {
            onInit();
        }
    }, []); // ComponentDidMount equivalent

    useEffect(() => {
        if (onUpdate) {
            onUpdate();
        }
    }); // ComponentDidUpdate equivalent

    const handleSliderChange = (_, newValue) => {
        handleChange(Number(newValue));
    };

    const labelFormatter = (value) => {
        return rangeClicksMap[value.toString()].toLocaleString("en-US", {
            maximumFractionDigits: 1,
        });
    };

    const sliderStyles = {
        color: "#17d384",
        ".MuiSlider-rail": {
            backgroundColor: "#c8d0da",
            opacity: 1,
        },
        ".MuiSlider-thumb": {
            width: "18px",
            height: "18px",
            top: "44%",
        },
        ".MuiSlider-mark": {
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#c8d0da",
            opacity: 1,
        },
        ".MuiSlider-markActive": {
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#17d384",
            opacity: 1,
        },
    };

    return (
        <form className={styles.form}>
            <Slider
                sx={sliderStyles}
                aria-label="Clicks"
                disabled={disabled}
                defaultValue={value}
                value={value}
                getAriaValueText={labelFormatter}
                onChange={handleSliderChange}
                step={step}
                marks={markers.map((mark) => ({
                    value: mark,
                    label: "",
                }))}
                min={min}
                max={max}
            />
        </form>
    );
}

RangeSlider.propTypes = {
    disabled: PropTypes.bool,
    onInit: PropTypes.func,
    onUpdate: PropTypes.func,
    id: PropTypes.string,
    value: PropTypes.any,
    handleChange: PropTypes.func,
    max: PropTypes.number,
    min: PropTypes.number,
    step: PropTypes.number,
    markers: PropTypes.array,
    rangeClicksMap: PropTypes.object,
};

export default RangeSlider;
