import React from "react";
import PropTypes from "prop-types";
import { AddressElement } from "@stripe/react-stripe-js";

const AddressForm = ({ values, onAddressChange }) => {
    return (
        <AddressElement
            options={{
                mode: "billing",
                defaultValues: values,
            }}
            onChange={onAddressChange}
        />
    );
};

AddressForm.propTypes = {
    values: PropTypes.object,
    onAddressChange: PropTypes.func.isRequired,
};

AddressForm.defaultProps = {
    values: {},
};

export default React.memo(AddressForm);
