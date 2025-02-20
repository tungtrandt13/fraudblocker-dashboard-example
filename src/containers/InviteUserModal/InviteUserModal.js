import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import {
    Button,
    Typography,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./InviteUserModal.module.scss";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import Validation from "../../utils/Validation";
import Users from "../../api/Users";

const customStyles = {
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    content: {
        position: "initial",
        inset: "auto", // Use 'inset'
        width: 501,
        height: "auto",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        padding: 0, // Remove default padding
    },
};

const InviteUserModal = ({ isOpen, toggleModal, getUsers, account, allRoles, auth, roleDropdownOptions }) => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [saved, setSaved] = useState(false);

    const handleCloseModal = useCallback(() => {
        toggleModal();
    }, [toggleModal]);

    const onRoleChange = useCallback((event) => {
        setRole(event.target.value);
    }, []);

    const onInputChange = useCallback((event) => {
        const { value, name } = event.target;
        switch (name) {
            case "firstName":
                setFirstName(value);
                break;
            case "lastName":
                setLastName(value);
                break;
            case "email":
                setEmail(value);
                break;
            default:
                break; // Do nothing for unknown input names
        }
    }, []);

    const onClickSendInvitation = useCallback(async () => {
        setLoading(true);
        setSaved(false);
        setErrors({}); // Clear previous errors

        let data = {
            email,
            first_name: firstName,
            last_name: lastName,
            role,
        };

        const newErrors = Validation.validateForm(data);
        if (newErrors) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }
        // Make sure allRoles and role are defined
        if (!allRoles || allRoles.length === 0 || !role) {
            setErrors({ invite: "Role is not properly defined." });
            setLoading(false);
            return;
        }
        const selectedRole = allRoles.find((r) => r.name === role);
        if (!selectedRole) {
            setErrors({ invite: "Role is not found." });
            setLoading(false);
            return;
        }

        data = {
            ...data,
            account_id: account.id,
            role: selectedRole.id,
            user: auth.user,
        };

        try {
            const result = await Users.inviteUser(data);
            if (result) {
                setSaved(true);
                await getUsers(); // Refresh user list
                // Reset form state
                setFirstName("");
                setLastName("");
                setEmail("");
                setRole("");
                setErrors({});
            }
        } catch (error) {
            console.error(error.message);
            setErrors({ invite: error.message });
        } finally {
            setLoading(false);
        }
    }, [email, firstName, lastName, role, getUsers, account.id, allRoles, auth.user, toggleModal]);

    return (
        <Modal isOpen={isOpen} style={customStyles} ariaHideApp={false} contentLabel="Invite User Modal">
            <Box className={styles.container}>
                <IconButton onClick={handleCloseModal} sx={{ position: "absolute", right: "10px", top: "10px" }}>
                    <CloseIcon />
                </IconButton>
                <Box sx={{ padding: "20px" }}>
                    <Typography variant="h5" component="p" className={styles.headerText} gutterBottom>
                        Invite others to this account
                    </Typography>
                    <Typography className={styles.descriptionText}>
                        {`After your invitee accepts the emailed invitation, they'll have access to this account.`}
                    </Typography>

                    <Box className={styles.nameContainer} sx={{ display: "flex", gap: 2, mb: 2 }}>
                        <TextField
                            onChange={onInputChange}
                            value={firstName}
                            name="firstName"
                            error={!!errors.first_name}
                            helperText={errors.first_name}
                            placeholder="First Name"
                            fullWidth
                        />
                        <TextField
                            onChange={onInputChange}
                            value={lastName}
                            name="lastName"
                            error={!!errors.last_name}
                            helperText={errors.last_name}
                            placeholder="Last Name"
                            fullWidth
                        />
                    </Box>
                    <TextField
                        onChange={onInputChange}
                        value={email}
                        name="email"
                        error={!!errors.email}
                        helperText={errors.email}
                        placeholder="Email Address"
                        fullWidth
                        sx={{ mb: 2 }}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.role}>
                        <InputLabel id="role-label">Access Level</InputLabel>
                        <Select
                            labelId="role-label"
                            value={role}
                            name="role"
                            onChange={onRoleChange}
                            label="Access Level"
                        >
                            <MenuItem value={""} disabled>
                                Select
                            </MenuItem>
                            {roleDropdownOptions.values.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.role && (
                            <Typography variant="caption" color="error">
                                {errors.role}
                            </Typography>
                        )}
                    </FormControl>

                    {errors.invite && <ErrorBox error={errors.invite} />}
                    <Button
                        variant="contained"
                        onClick={onClickSendInvitation}
                        color="success"
                        disabled={loading}
                        sx={{ alignSelf: "center", mb: 2, mt: 2 }}
                    >
                        {loading ? "Sending Invitation..." : "Send Invitation"}
                    </Button>
                    {saved && (
                        <Alert severity="success" sx={{ alignSelf: "center", mb: 2, mt: 2 }}>
                            ✓ Invitation sent
                        </Alert>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

InviteUserModal.propTypes = {
    isOpen: PropTypes.bool,
    toggleModal: PropTypes.func,
    getUsers: PropTypes.func,
    account: PropTypes.shape({
        id: PropTypes.string.isRequired,
    }).isRequired,
    allRoles: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
        })
    ),
    roleDropdownOptions: PropTypes.shape({
        values: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.string,
                label: PropTypes.string,
            })
        ),
    }),
    auth: PropTypes.shape({
        user: PropTypes.object,
    }),
};

export default InviteUserModal;
