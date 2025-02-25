import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet";
import { useSelector, useDispatch } from "react-redux";
import RouteConfig from "../../router/RouteConfig";
import AuthedRoute from "../../router/AuthedRoute";
import styles from "./DefaultLayout.module.scss";
import Navigation from "../Navigation/Navigation";
import subMenu from "../SubMenu/submenu-options";
import SubMenu from "../SubMenu/SubMenu";
import ActiveDomain from "../../redux/actions/ActiveDomain";
import Account from "../../redux/actions/Account";

const DefaultLayout = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Thay useHistory bằng useNavigate
  const dispatch = useDispatch();
  const { auth, accounts, activeDomain } = useSelector((state) => ({
    auth: state.auth,
    accounts: state.accounts,
    activeDomain: state.activeDomain,
  }));

  const [showSubNav, setShowSubNav] = useState(false);
  const [actOnInvalidSubscription, setActOnInvalidSubscription] = useState(false);
  const [actOnNoDomain, setActOnNoDomain] = useState(false);

  useEffect(() => {
    dispatch(Account.checkSubscription(accounts));
  }, [accounts, dispatch]);

  useEffect(() => {
    if (RouteConfig.routesWithSubNav.includes(location.pathname)) {
      setShowSubNav(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (
      accounts &&
      !accounts.isFetching &&
      accounts.data &&
      accounts.data.stripe_token &&
      !accounts.subscriptionValid
    ) {
      setActOnInvalidSubscription(true);
    }

    const activeDomains =
      accounts?.data?.domains?.filter((item) => !item.is_deleted).length || 0;
    setActOnNoDomain(
      accounts && !accounts.isFetching && accounts.data && !activeDomains
    );

    if (RouteConfig.routesWithSubNav.includes(location.pathname)) {
      setShowSubNav(true);
    } else {
      setShowSubNav(false);
    }

    dispatch(Account.checkSubscription(accounts));
  }, [location.pathname, accounts, dispatch]);

  const getSubMenuOptions = () => {
    if (location.pathname.includes("/customizations")) return subMenu.customizationMenu;
    if (location.pathname.includes("/integrations")) return subMenu.integrationsMenu;
    if (location.pathname.includes("domain")) return subMenu.dashboardMenu;
    if (location.pathname.includes("account")) return subMenu.accountMenu;
    return [];
  };

  const getGroupName = () => {
    if (location.pathname.includes("/customizations")) return "Customizations";
    if (location.pathname.includes("/integrations")) return "Set Up Your Website";
    if (location.pathname.includes("domain")) return "Website Menu";
    if (location.pathname.includes("account")) return "Your Account";
    return "";
  };

  const setDomain = (domain) => {
    dispatch(ActiveDomain.setDomainActive(domain));
    dispatch(Account.checkSubscription(accounts));
  };

  return (
    <div className={styles.all}>
      <Helmet>
        <title>Fraud Blocker</title>
      </Helmet>
      <Navigation setDomain={setDomain} location={location} navigate={navigate} />
      {showSubNav && (
        <SubMenu
          location={location}
          menu={getSubMenuOptions()}
          accounts={accounts}
          hasMetaAccess={true}
          activeDomain={activeDomain}
          setDomain={setDomain}
          userRole={auth.user.role}
          group={getGroupName()}
        />
      )}
      <Routes>
        {RouteConfig.routes.map((route) => {
          // if (
          //   actOnNoDomain &&
          //   location.pathname === route.path &&
          //   route.requiresDomain &&
          //   !location.pathname.includes("/account/billing/subscription")
          // ) {
          //   return (
          //     <Route
          //       key={route.path}
          //       path={route.path}
          //       element={<Navigate to="/account/billing/subscription" state={{ forceAddDomain: true }} />}
          //     />
          //   );
          // }

          // if (
          //   actOnInvalidSubscription &&
          //   location.pathname === route.path &&
          //   route.requiresSubscription
          // ) {
          //   if (auth.user.role === "Viewer") {
          //     if (location.pathname !== "/account/settings/edit-profile") {
          //       return (
          //         <Route
          //           key={route.path}
          //           path={route.path}
          //           element={<Navigate to="/account/settings/edit-profile" />}
          //         />
          //       );
          //     }
          //   } else if (!location.pathname.includes("/account/billing/subscription")) {
          //     return (
          //       <Route
          //         key={route.path}
          //         path={route.path}
          //         element={
          //           <Navigate
          //             to={{
          //               pathname: "/account/billing/subscription",
          //               state: { invalidSubscription: true, showPlansPopup: true },
          //             }}
          //           />
          //         }
          //       />
          //     );
          //   }
          // }

          if (route.redirect) {
            return (
              <Route
                key={route.path}
                exact={route.exact}
                path={route.path}
                element={<Navigate to={route.redirect} />}
              />
            );
          }

          if (
            route.path === location.pathname &&
            route.protected &&
            route.path === "/account/settings/user-management" &&
            ["Viewer", "Manager", "Client"].includes(auth.user.role)
          ) {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={<Navigate to="/account/settings/edit-profile" />}
              />
            );
          }

          if (
            route.path === location.pathname &&
            route.protected &&
            (auth.user.role === "Viewer" ||
              (route.blockForRoles && route.blockForRoles.includes(auth.user.role)))
          ) {
            return (
              <Route key={route.path} path={route.path} element={<Navigate to="/dashboard" />} />
            );
          }

          console.log('chay den day roi nay', route.component)

          return route.component ? (
            <Route
              key={route.path}
              exact={route.exact}
              path={route.path}
              element={
                <AuthedRoute
                  auth={auth}
                  activeDomain={activeDomain}
                  accounts={accounts}
                  component={route.component}
                />
              }
            />
          ) : null;
        })}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
};

DefaultLayout.propTypes = {
  auth: PropTypes.object,
  location: PropTypes.object,
  navigate: PropTypes.func, // Thay history bằng navigate
  accounts: PropTypes.object,
  activeDomain: PropTypes.object,
  setDomain: PropTypes.func,
  checkSubscription: PropTypes.func,
};

export default DefaultLayout;
