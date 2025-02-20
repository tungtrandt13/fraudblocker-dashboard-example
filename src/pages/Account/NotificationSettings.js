import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { connect, useDispatch, useSelector } from "react-redux";
import styles from "./Account.module.scss";
import Switch from "../../components/Switch/Switch";
import User from "../../redux/actions/User";

const customStyles = {
    switchContainer: {
        display: "flex",
        alignItems: "center",
        marginTop: 30,
    },
    switchText: {
        marginLeft: 10,
        fontWeight: "600",
    },
};

const intercomNotificationMapping = {
    notification_promos: "notif_discount_and_promotions",
    notification_alerts: "notif_real_time_alerts",
    notification_announcements: "notif_company_announcements",
    notification_news: "notif_fraud_industry_news",
};

const NotificationSettings = () => {
    const auth = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const onSwitchChange = useCallback(
        async (name) => {
            const updateData = {
                [name]: !auth.user[name],
            };

            try {
                const result = await dispatch(User.updateUser(auth.user.id, updateData));
                console.log(result);
                window.Intercom("update", {
                    user_id: auth.user.id,
                    [intercomNotificationMapping[name]]: updateData[name],
                });
            } catch (error) {
                console.log(error);
                // Consider adding error handling here, e.g., setting an error state
            }
        },
        [auth.user, dispatch]
    );

    const {
        notification_promos: promos,
        notification_alerts: alerts,
        notification_announcements: announcements,
        notification_news: news,
    } = auth.user;

    return (
        <div className={styles.content}>
            <h1 className={styles.title}> App Notifications </h1>
            <p> Adjust your email notification settings here. </p>
            <div style={customStyles.switchContainer}>
                <Switch
                    checked={promos}
                    name="notification_promos"
                    onChange={() => onSwitchChange("notification_promos")}
                />
                <p style={customStyles.switchText}> Discount and Promotions </p>
            </div>

            <div style={customStyles.switchContainer}>
                <Switch
                    checked={alerts}
                    name="notification_alerts"
                    onChange={() => onSwitchChange("notification_alerts")}
                />
                <p style={customStyles.switchText}>Real-time alerts when a fraudulent IP is detected</p>
            </div>

            <div style={customStyles.switchContainer}>
                <Switch
                    checked={announcements}
                    name="notification_announcements"
                    onChange={() => onSwitchChange("notification_announcements")}
                />
                <p style={customStyles.switchText}> Company announcements </p>
            </div>

            <div style={customStyles.switchContainer}>
                <Switch checked={news} name="notification_news" onChange={() => onSwitchChange("notification_news")} />
                <p style={customStyles.switchText}> Fraud industry news </p>
            </div>
        </div>
    );
};

NotificationSettings.propTypes = {
    auth: PropTypes.object, // Keep auth, it's still used
};

export default connect()(NotificationSettings); // Remove map
