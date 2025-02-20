import React, { useState, useCallback, useEffect } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import moment from "moment-timezone";
import PropTypes from "prop-types";
import { Tooltip as ReactTooltip } from "react-tooltip";
import styles from "./Account.module.scss";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Dropdown from "../../components/Dropdown/Dropdown";
import User from "../../redux/actions/User";
import Validation from "../../utils/Validation";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import { ReactComponent as TooltipIcon } from "../../assets/tooltip.svg";
import Constants from "../../utils/Constants";
import SuccessBox from "../../components/SuccessBox/SuccessBox";

const allTimezones = Constants.getAllTimezones();
const { currencyOptions } = Constants;

const customStyles = {
    editPhotoContainer: {
        marginTop: 20,
        marginBottom: 20,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    },
    editPhotoBtn: {
        width: 110,
    },
    userPhotoContainer: {
        width: 52,
        height: 52,
        marginRight: 20,
        borderRadius: 26,
        backgroundColor: "#5289ff",
    },
    userPhoto: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    initials: {
        fontSize: 26,
    },
    firstLastContainer: {
        display: "flex",
        alignItems: "stretch",
    },
    editTitle: {
        marginBottom: 10,
    },
    editInput: {
        marginBottom: 30,
    },
    editContainer: {
        flex: 1,
        flexDirection: "column",
    },
    firstNameContainer: {
        flex: 1,
        flexDirection: "column",
        marginRight: 48,
    },
    footerBtnContainer: {
        marginTop: 30,
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
    },
    saveBtn: {
        maxWidth: 110,
        height: "41px",
    },
    deleteAccountBtn: {
        maxWidth: 200,
        color: "#4a4a4a",
    },
    saved: {
        maxWidth: "200px",
        marginLeft: "10px",
        fontWeight: "600",
        padding: "10px 15px",
        marginTop: 0,
        marginBottom: 0,
    },
};

const EditProfile = () => {
    const auth = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [user, setUser] = useState(auth.user);

    const [firstName, setFirstName] = useState(auth.user.first_name);
    const [lastName, setLastName] = useState(auth.user.last_name);
    const [email, setEmail] = useState(auth.user.email);
    const [currency, setCurrency] = useState(
        auth.user.currency ? currencyOptions.find((item) => item.value === auth.user.currency) : currencyOptions[0]
    );
    const [uploadedImage, setUploadedImage] = useState(null);
    const [uploadedImageFile, setUploadedImageFile] = useState(null);
    const [timezone, setTimezone] = useState({
        value: auth.user.timezone || "(GMT-07:00) America/Los_Angeles",
        label: auth.user.timezone || "(GMT-07:00) America/Los_Angeles",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Update state when user data changes
        setUser(auth.user);
        setFirstName(auth.user.first_name);
        setLastName(auth.user.last_name);
        setEmail(auth.user.email);
        setCurrency(
            auth.user.currency ? currencyOptions.find((item) => item.value === auth.user.currency) : currencyOptions[0]
        );
        setTimezone({
            value: auth.user.timezone || "(GMT-07:00) America/Los_Angeles",
            label: auth.user.timezone || "(GMT-07:00) America/Los_Angeles",
        });
    }, [auth.user]);

    const onEditPhotoClick = useCallback(() => {
        // No need for this function if you're not using the button
        // this.imageUploader.click();
    }, []);

    const onImageChange = useCallback((event) => {
        if (event.target.files && event.target.files[0]) {
            setUploadedImageFile(event.target.files[0]);
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedImage(e.target.result);
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    }, []);

    const onInputChange = useCallback((event) => {
        const { value, name } = event.target;
        if (name === "firstName") {
            setFirstName(value);
        } else if (name === "lastName") {
            setLastName(value);
        } else {
            setEmail(value);
        }
    }, []);

    const onOptionChange = useCallback((name, selectedOption) => {
        if (name === "timezone") {
            setTimezone(selectedOption);
        } else {
            setCurrency(selectedOption);
        }
    }, []);

    const onSaveClick = useCallback(async () => {
        setLoading(true);
        setSaved(false);

        const requiredData = { firstName, lastName, email };
        const newErrors = Validation.validateForm(requiredData);

        if (newErrors) {
            setErrors(newErrors);
            setLoading(false);
            console.log("invalidForm: ", newErrors);
            return;
        }

        try {
            const updateData = {
                first_name: requiredData.firstName,
                last_name: requiredData.lastName,
                email: requiredData.email,
                ...(currency.value && { currency: currency.value }),
                ...(timezone.value && { timezone: timezone.value }),
            };

            if (uploadedImageFile) {
                const downloadUrl = await User.uploadPhoto(auth.user.id, uploadedImageFile);
                updateData.profile_picture = downloadUrl;
            }

            if (timezone.value) {
                moment.tz.setDefault(timezone.value.substr(timezone.value.indexOf(") ") + 2));
            }

            if (updateData.email !== auth.user.email) {
                await User.updateEmailFirebase(updateData.email);
            }

            const result = await dispatch(User.updateUser(auth.user.id, updateData));
            if (result) {
                setSaved(true);
                setErrors({});
                setLoading(false);
                setUploadedImage(null);
                setUploadedImageFile(null);
            }
        } catch (error) {
            console.log(error);
            setErrors({ save: error.message });
            setLoading(false);
        }
    }, [firstName, lastName, email, uploadedImageFile, timezone, currency, auth.user.id, dispatch]);

    const onDeleteAccountClick = useCallback(() => {
        console.log("delete account");
    }, []);

    return (
        <div className={styles.content}>
            <h1 className={styles.title}> Edit Profile </h1>
            <ReactTooltip
                effect="solid"
                delayHide={500}
                delayUpdate={500}
                className={styles.emailChangeTooltip}
                id="emailChange"
            >
                To change your account email, please{" "}
                <a href="mailto:info@fraudblocker.com?subject=Change Account Email Address">email</a> our support team.
            </ReactTooltip>
            <p> Adjust your email and profile settings here. </p>
            <div style={customStyles.editPhotoContainer}>
                <input
                    type="file"
                    ref={(ref) => {
                        // this.imageUploader = ref; // No longer needed with functional components
                    }}
                    accept="image/jpg,image/png"
                    onChange={onImageChange}
                    className={styles.uploadImageInput}
                    id="group_image"
                />
            </div>

            <div style={customStyles.firstLastContainer}>
                <div style={customStyles.firstNameContainer}>
                    <p style={customStyles.editTitle}> First Name </p>
                    <Input
                        containerStyle={customStyles.editInput}
                        onChange={onInputChange}
                        value={firstName}
                        name="firstName"
                        error={errors.firstName}
                    />
                </div>
                <div style={customStyles.editContainer}>
                    <p style={customStyles.editTitle}> Last Name </p>
                    <Input
                        containerStyle={customStyles.editInput}
                        onChange={onInputChange}
                        value={lastName}
                        name="lastName"
                        error={errors.lastName}
                    />
                </div>
            </div>

            <div style={customStyles.emailContainer}>
                <p style={customStyles.editTitle}>
                    Email Address
                    <TooltipIcon className={styles.emailChangeTip} data-tip data-for="emailChange" />
                </p>
                <Input
                    containerStyle={customStyles.editInput}
                    onChange={onInputChange}
                    value={email}
                    name="email"
                    error={errors.email}
                    disabled={true}
                />
            </div>
            <div style={customStyles.firstLastContainer}>
                <div style={customStyles.firstNameContainer}>
                    <p style={customStyles.editTitle}> Time Zone </p>
                    <Dropdown
                        options={allTimezones.values}
                        onOptionChange={(val) => onOptionChange("timezone", val)}
                        style={customStyles.dropdown}
                        value={timezone}
                    />
                </div>
                <div style={customStyles.editContainer}>
                    <p style={customStyles.editTitle}> Currency </p>
                    <Dropdown
                        options={currencyOptions}
                        value={currency}
                        selectClass={styles.currencySelection}
                        style={customStyles.dropdown}
                        name="currency"
                        onOptionChange={(val) => onOptionChange("currency", val)}
                    />
                </div>
            </div>
            {errors.save && (
                <div className={styles.errorBox}>
                    <ErrorBox error={errors.save} />
                </div>
            )}

            <div style={customStyles.footerBtnContainer}>
                <Button
                    title="Save"
                    color="blue"
                    loading={loading}
                    style={customStyles.saveBtn}
                    onClick={onSaveClick}
                />
                {saved && (
                    <SuccessBox override={true} style={customStyles.saved} message="✓ Your profile was updated" />
                )}
                {/* Delete Account Button - Commented out for now */}
                {/* <Button
          title="Delete Account and Data"
          color="none"
          style={customStyles.deleteAccountBtn}
          onClick={onDeleteAccountClick}
        /> */}
            </div>
        </div>
    );
};

EditProfile.propTypes = {
    updateUser: PropTypes.func,
    auth: PropTypes.object,
};

const mapStateToProps = (state) => ({
    auth: state.auth,
});
// const mapDispatchToProps = (dispatch) => {
//   return {
//     updateUser: (id, data) => dispatch(User.updateUser(id, data)),
//   };
// };

export default connect(mapStateToProps)(EditProfile);
