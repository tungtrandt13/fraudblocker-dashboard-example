import { combineReducers } from "redux";
import AuthReducer from "./AuthReducer";
import AccountReducer from "./AccountReducer";
import ActiveDomainReducer from "./ActiveDomainReducer";
import IpBlockListReducer from "./IpBlockListReducer";

const AppReducer = combineReducers({
    auth: AuthReducer,
    accounts: AccountReducer,
    activeDomain: ActiveDomainReducer,
    ipBlocklist: IpBlockListReducer,
});

const rootReducer = (state, action) => {
    return AppReducer(state, action);
};

export default rootReducer;
