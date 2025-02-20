import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
    Avatar,
    Box,
    FormControl,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Radio,
    RadioGroup,
    Typography,
} from "@mui/material";
import Button from "../../components/Button/Button";
import ErrorBox from "../../components/ErrorBox/ErrorBox";
import SuccessBox from "../../components/SuccessBox/SuccessBox";
import InviteUserModal from "../../containers/InviteUserModal/InviteUserModal";
import Users from "../../api/Users";
import Roles from "../../api/Roles";
import { ReactComponent as CheckIcon } from "../../assets/ok-icon.svg";
import { ReactComponent as LockIcon } from "../../assets/lock.svg";
import { ReactComponent as CaretDown } from "../../assets/caret_down.svg";
import Dropdown from "../../components/Dropdown/Dropdown"; // Keep this, but we'll style it with MUI later
import styles from "./Account.module.scss";
import { Delete } from "@mui/icons-material";

const DEFAULT_DOMAIN_SELECTION = {
    value: null,
    label: "All Websites",
};

const UserManagement = () => {
    const [roles, setRoles] = useState([]);
    const [removingIndex, setRemovingIndex] = useState("");
    const [roleDropdownOptions, setRoleDropdownOptions] = useState({ values: [] });
    const [allUsers, setAllUsers] = useState([]);
    const [originalUsers, setOriginalUsers] = useState([]);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState({});
    const [activeIndex, setActiveIndex] = useState(-1);
    const [selectedDomain, setSelectedDomain] = useState(DEFAULT_DOMAIN_SELECTION);
    const [domainOptions, setDomainOptions] = useState([]);

    const dispatch = useDispatch();
    const { accounts, auth } = useSelector((state) => state);

    const getAllRoles = useCallback(async () => {
        try {
            const allRoles = await Roles.getAllRoles();
            const filteredRoles = allRoles.filter((role) => role.name !== "Owner");
            setRoles(allRoles);
            setRoleDropdownOptions({
                values: filteredRoles.map((role) => ({
                    value: role.name,
                    label: role.name,
                })),
            });
        } catch (error) {
            console.error(error);
        }
    }, []);

    const getUsersInAccount = useCallback(async () => {
        if (!accounts.data) return;

        try {
            const allUsersData = await Users.getAllUsersInAccount(accounts.data.id);
            const filteredUsers = [
                allUsersData.find((user) => user.id === auth.user.id),
                ...allUsersData.filter((user) => user.id !== auth.user.id),
            ];
            setAllUsers(filteredUsers);
            setOriginalUsers(JSON.parse(JSON.stringify(filteredUsers))); // Deep copy
            setErrors({});
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    }, [accounts.data, auth.user.id]);

    useEffect(() => {
        getAllRoles();
        getUsersInAccount();
        if (accounts?.data?.domains) {
            const optionsDefault = accounts.data.domains
                .sort((a, b) => (a.domain_name.toLowerCase() < b.domain_name.toLowerCase() ? -1 : 1))
                .filter((item) => !item.is_deleted)
                .map((item) => ({
                    value: item.id,
                    label: item.domain_name,
                }));

            setDomainOptions([DEFAULT_DOMAIN_SELECTION, ...optionsDefault]);
        }
    }, [getAllRoles, getUsersInAccount, accounts.data?.domains]);

    const onRoleChange = useCallback(
        (selectedOption, index) => {
            setAllUsers((currentUsers) => {
                const newUsers = [...currentUsers];
                const selectedRole = roles.find((role) => role.name === selectedOption);
                newUsers[index].role_id = selectedRole.id;
                return newUsers;
            });

            setSelectedDomain(DEFAULT_DOMAIN_SELECTION);
        },
        [roles]
    );

    const addDomainAccess = useCallback((domain, index) => {
        setAllUsers((currentUsers) => {
            const newUsers = [...currentUsers];
            if (domain.value === null) {
                newUsers[index].accessible_domains = null;
            } else {
                const newDomain = { id: domain.value };
                newUsers[index].accessible_domains = newUsers[index].accessible_domains
                    ? [...newUsers[index].accessible_domains, newDomain]
                    : [newDomain];
            }
            return newUsers;
        });
        setSelectedDomain(domain);
    }, []);

    const removeDomainAccess = useCallback((domainId, index) => {
        setAllUsers((currentUsers) => {
            const newUsers = [...currentUsers];
            newUsers[index].accessible_domains = newUsers[index].accessible_domains.filter(
                (item) => item.id !== domainId
            );
            return newUsers;
        });
        setSelectedDomain(null); // Consider if you really need this.  Might be better to leave selectedDomain alone.
    }, []);

    const updateUsers = useCallback(
        async (selectedIndex = null) => {
            if (selectedIndex === null) return;

            const userToUpdate = allUsers[selectedIndex];
            const userRole = roles.find((role) => userToUpdate.role_id === role.id);

            return await Users.updateAccountUser(userToUpdate.id, {
                role_id: userToUpdate.role_id,
                accessible_domains:
                    userRole?.name !== "Admin" && userToUpdate.accessible_domains?.length
                        ? userToUpdate.accessible_domains
                        : null, // Send null if Admin or no domains
            });
        },
        [allUsers, roles]
    );

    const updateUserAccess = useCallback(
        async (index) => {
            setLoading(true);
            setErrors({});
            setShowSuccess({});

            try {
                const result = await updateUsers(index);
                if (result) {
                    const updatedUsers = [...originalUsers];
                    updatedUsers[index] = { ...allUsers[index] }; // Clone the updated user.
                    setOriginalUsers(updatedUsers);

                    setShowSuccess({ message: "Update Successful" });
                }
            } catch (error) {
                setErrors({ saveError: error.message });
                setShowSuccess({});
            } finally {
                setLoading(false);
                setActiveIndex(-1);
            }
        },
        [updateUsers, originalUsers, allUsers]
    );

    const resendInvite = useCallback(
        async (index) => {
            const selectedUser = allUsers[index];
            const data = {
                email: selectedUser.email,
                first_name: selectedUser.first_name,
                last_name: selectedUser.last_name,
            };

            try {
                const result = await Users.resendInvite(data);
                window.Intercom("trackEvent", "resend-user-invite", {
                    ...data,
                    invite_id: result.id,
                });
                if (result) {
                    setShowSuccess({ message: "Invitation Resent!" });
                }
            } catch (error) {
                setShowSuccess({});
                setErrors({ resendError: "Error Resending Invitation." });
            }
        },
        [allUsers]
    );

    const removeUser = useCallback(
        async (index) => {
            const selectedUser = allUsers[index];
            try {
                setRemovingIndex(index);
                await Users.removeUser(selectedUser.id);
                if (selectedUser.status === "AWAITING_RESPONSE") {
                    await Users.removeInvitation(selectedUser.email);
                }
                await getUsersInAccount(); // Refresh user list
                setShowSuccess({ message: `${selectedUser.email} has been removed.` });
            } catch (error) {
                setErrors({ removeError: error.message });
            } finally {
                setRemovingIndex("");
            }
        },
        [allUsers, getUsersInAccount]
    );

    const toggleAddUserModal = useCallback(() => {
        setShowAddUserModal((prev) => !prev);
    }, []);

    const toggleUserList = useCallback(
        (index) => {
            setActiveIndex(activeIndex === index ? -1 : index);
            if (allUsers[index].accessible_domains && allUsers[index].accessible_domains.length) {
                setSelectedDomain(null);
                return;
            }
            setSelectedDomain(DEFAULT_DOMAIN_SELECTION);
        },
        [activeIndex, allUsers]
    );

    const formatStatus = useCallback((status) => {
        if (status === "AWAITING_RESPONSE") {
            return "Awaiting Response";
        }
        return status.length ? `<span class="math-inline">\{status\[0\]\}</span>{status.slice(1).toLowerCase()}` : "";
    }, []);

    const userHasChanges = (index) => {
        const original = originalUsers[index];
        const current = allUsers[index];

        // Basic checks for role and status
        if (original.role_id !== current.role_id || original.status !== current.status) {
            return true;
        }

        // Check for differences in accessible_domains
        const originalDomains = original.accessible_domains || [];
        const currentDomains = current.accessible_domains || [];

        if (originalDomains.length !== currentDomains.length) {
            return true;
        }
        const originalDomainIds = new Set(originalDomains.map((d) => d.id));
        const currentDomainIds = new Set(currentDomains.map((d) => d.id));

        for (let id of originalDomainIds) {
            if (!currentDomainIds.has(id)) {
                return true;
            }
        }
        return false; // No changes
    };

    return (
        <Box className={styles.content}>
            <Typography variant="h1" className={styles.title}>
                User Management
            </Typography>
            <Typography>Invite teammates to join your account.</Typography>

            <Box component="section">
                <Box component="header" className={styles.tableRow}>
                    <Box className={styles.tableColumn}>
                        <Typography variant="h3">Name</Typography>
                    </Box>
                    <Box className={styles.tableColumn}>
                        <Typography variant="h3">Last Login</Typography>
                    </Box>
                    <Box className={styles.tableColumn}>
                        <Typography variant="h3">Access</Typography>
                    </Box>
                    <Box className={styles.tableColumn} />
                </Box>

                {allUsers.map((user, index) => {
                    const userRole = roles.find((role) => role.id === user.role_id);
                    const savedUserRole = roles.find(
                        (role) => role.id === originalUsers[index]?.role_id // Safe access
                    );
                    const userRoleDropdown = userRole ? { value: userRole.name, label: userRole.name } : "";
                    const userStatus = formatStatus(user.status);

                    return (
                        <Box
                            key={index}
                            className={`${styles.tableRow} ${styles.userManagementRow} ${
                                removingIndex === index ? styles.removeUserManagementRow : ""
                            }`}
                        >
                            <Box className={styles.tableColumn}>
                                <Box sx={customStyles.nameContainer}>
                                    <ListItemAvatar>
                                        <Avatar
                                            sx={customStyles.userPhotoContainer}
                                            src={user.photo_url ? user.photo_url : ""}
                                        >
                                            {!user.photo_url
                                                ? `<span class="math-inline">\{user\.first\_name?\.\[0\] \|\| ''\}</span>{user.last_name?.[0] || ''}`
                                                : ""}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <Box>
                                        <Typography sx={customStyles.userName}>
                                            {`${user.first_name || "Your"} ${user.last_name || "Name"}`}
                                        </Typography>
                                        <Typography sx={customStyles.userEmail}>{user.email}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box className={styles.tableColumn}>
                                {user.status === "AWAITING_RESPONSE" ? (
                                    <Typography sx={customStyles.lastSignInTime}>{userStatus}</Typography>
                                ) : (
                                    <Typography sx={customStyles.lastSignInTime}>
                                        {user.lastSignInTime
                                            ? moment(user.lastSignInTime).format("M/DD/YY LT")
                                            : formatStatus(user.status)}
                                    </Typography>
                                )}
                            </Box>
                            <Box className={styles.tableColumn}>
                                <Typography sx={customStyles.accessText}>{savedUserRole?.name}</Typography>
                            </Box>
                            <Box className={styles.tableColumn}>
                                {userRoleDropdown && userRoleDropdown.value !== "Owner" ? (
                                    <Box className={styles.actionsColumn}>
                                        <IconButton
                                            onClick={() => toggleUserList(index)}
                                            className={`${styles.toggleBtn} ${
                                                index === activeIndex ? styles.active : ""
                                            }`}
                                            size="small"
                                        >
                                            <CaretDown />
                                        </IconButton>
                                    </Box>
                                ) : (
                                    <Typography component="p" sx={customStyles.iconAction}>
                                        <LockIcon sx={customStyles.lockBtn} />
                                    </Typography>
                                )}
                            </Box>

                            {/* Expanded User Row */}
                            {userRoleDropdown.value !== "Owner" && activeIndex === index && (
                                <Box
                                    className={`${styles.toogleItems} ${activeIndex === index ? styles.expandedUserRow : ""}`}
                                >
                                    <Box className={styles.accountAuth}>
                                        <Box className={styles.leftCol}>
                                            <Box className={styles.tabHeading}>
                                                <Typography variant="subtitle2" className={styles.heading}>
                                                    Account Level
                                                </Typography>
                                                <FormControl component="fieldset">
                                                    <RadioGroup
                                                        aria-label="roles"
                                                        name="roles"
                                                        value={userRoleDropdown.value}
                                                        onChange={(e) => onRoleChange(e.target.value, index)}
                                                    >
                                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                                            <FormControlLabel
                                                                value="Viewer"
                                                                control={<Radio />}
                                                                label="Viewer"
                                                                id={`viewer${index}`}
                                                            />
                                                        </Box>
                                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                                            <FormControlLabel
                                                                value="Client"
                                                                control={<Radio />}
                                                                label="Client"
                                                                id={`client${index}`}
                                                            />
                                                        </Box>
                                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                                            <FormControlLabel
                                                                value="Manager"
                                                                control={<Radio />}
                                                                label="Manager"
                                                                id={`manager${index}`}
                                                            />
                                                        </Box>

                                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                                            <FormControlLabel
                                                                value="Admin"
                                                                control={<Radio />}
                                                                label="Admin"
                                                                id={`admin${index}`}
                                                            />
                                                        </Box>
                                                    </RadioGroup>
                                                </FormControl>
                                            </Box>
                                            <Box className={styles.tabItems}>
                                                <Typography className={styles.items}>View Reporting</Typography>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                            </Box>
                                            <Box className={styles.tabItems}>
                                                <Typography className={styles.items}>Connect Ad Networks</Typography>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                            </Box>
                                            <Box className={styles.tabItems}>
                                                <Typography className={styles.items}>Change Customizations</Typography>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                            </Box>
                                            <Box className={styles.tabItems}>
                                                <Typography className={styles.items}>Add & Delete Websites</Typography>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                            </Box>
                                            <Box className={styles.tabItems}>
                                                <Typography className={styles.items}>Invite Users</Typography>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                            </Box>
                                            <Box className={styles.tabItems}>
                                                <Typography className={styles.items}>Set Click Limits</Typography>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                            </Box>
                                            <Box className={styles.tabItems}>
                                                <Typography className={styles.items}>View Plan Subscription</Typography>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                            </Box>
                                            <Box className={styles.tabItems}>
                                                <Typography className={styles.items}>Edit User Access</Typography>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                            </Box>

                                            <Box className={styles.tabItems}>
                                                <Typography className={styles.items}>
                                                    Change Plan Subscription
                                                </Typography>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}></Box>
                                                <Box className={styles.items}>
                                                    <CheckIcon />
                                                </Box>
                                            </Box>
                                        </Box>

                                        {userRoleDropdown && (
                                            <Box className={styles.rightCol}>
                                                <Box className={styles.selectDomain}>
                                                    <Box className={styles.selectWrapper}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            className={styles.selectHeading}
                                                        >
                                                            Select Website Access
                                                        </Typography>
                                                        {/*  MUI styling for the Dropdown */}
                                                        <Dropdown
                                                            index={index}
                                                            placeholder="Select"
                                                            isDisabled={userRoleDropdown.value === "Admin"}
                                                            isSearchable={false}
                                                            name="user_domains_access"
                                                            onOptionChange={(val) => addDomainAccess(val, index)}
                                                            value={selectedDomain}
                                                            options={domainOptions}
                                                        />
                                                        {userRoleDropdown.value === "Admin" && (
                                                            <Box className={styles.lockedDomainWrap}>
                                                                <LockIcon sx={customStyles.lockedDomain} />
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    {userRoleDropdown.value !== "Admin" &&
                                                        user.accessible_domains?.length > 0 && ( // Safe access
                                                            <Box className={styles.domainList}>
                                                                <List>
                                                                    {user.accessible_domains.map((domain) => {
                                                                        const domainOption = domainOptions.find(
                                                                            (item) => item.value === domain.id
                                                                        );
                                                                        return (
                                                                            <ListItem key={domain.id}>
                                                                                <ListItemText
                                                                                    primary={
                                                                                        domainOption
                                                                                            ? domainOption.label
                                                                                            : "Unknown"
                                                                                    }
                                                                                />
                                                                                <IconButton
                                                                                    onClick={() =>
                                                                                        removeDomainAccess(
                                                                                            domain.id,
                                                                                            index
                                                                                        )
                                                                                    }
                                                                                    edge="end"
                                                                                    aria-label="delete"
                                                                                    size="small"
                                                                                >
                                                                                    <Delete />
                                                                                </IconButton>
                                                                            </ListItem>
                                                                        );
                                                                    })}
                                                                </List>
                                                            </Box>
                                                        )}
                                                </Box>
                                                <Box className={styles.btnDomain}>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => updateUserAccess(index)}
                                                        disabled={loading || !userHasChanges(index)} // Disable if no changes
                                                    >
                                                        {loading ? "Saving..." : "Save & Close"}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                    <Box className={styles.btnGroup}>
                                        {userRoleDropdown.value !== "Owner" && (
                                            <Button
                                                variant="text"
                                                color="error"
                                                onClick={() => removeUser(index)}
                                                startIcon={<Delete />}
                                                disabled={removingIndex === index}
                                            >
                                                {removingIndex === index ? "Deleting..." : "Delete User"}
                                            </Button>
                                        )}
                                        {user.status === "AWAITING_RESPONSE" && (
                                            <Button variant="text" color="primary" onClick={() => resendInvite(index)}>
                                                Resend email
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>
            {(errors.saveError || errors.resendError || errors.removeError) && (
                <ErrorBox error={errors.saveError || errors.resendError || errors.removeError} />
            )}
            {showSuccess.message && <SuccessBox message={showSuccess.message} />}

            <Box sx={customStyles.saveBtnWrapper}>
                <Button variant="outlined" color="primary" onClick={toggleAddUserModal} sx={customStyles.addUserBtn}>
                    + Add User
                </Button>
            </Box>

            <InviteUserModal
                isOpen={showAddUserModal}
                getUsers={getUsersInAccount}
                toggleModal={toggleAddUserModal}
                account={accounts.data}
                allRoles={roles}
                auth={auth}
                roleDropdownOptions={roleDropdownOptions} //passing data
            />
        </Box>
    );
};

UserManagement.propTypes = {
    auth: PropTypes.object,
    accounts: PropTypes.object,
};

export default UserManagement;
