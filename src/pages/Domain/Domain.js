import React from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import styles from "./Domain.module.scss";
import AddDomainModal from "../../containers/AddDomainModal/AddDomainModal";
import AnalyticsDashboard from "../../containers/Dashboard/Dashboard";

const Domain = () => {
    const location = useLocation();
    const showModal = location.state ? location.state.modal : false;

    return (
        <div className={styles.content}>
            <AddDomainModal isOpen={showModal} />
            <AnalyticsDashboard />
        </div>
    );
};

Domain.propTypes = {
    showModal: PropTypes.bool,
    location: PropTypes.object.isRequired,
};

Domain.defaultProps = {
    showModal: false,
};

export default Domain;
