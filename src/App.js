import React, { useEffect } from "react";
import { Provider } from "react-redux";
import "./App.scss";
import "./theme/style.scss";
import Store from "./redux/Store";
import Router from "./router/Router";

function App() {
    useEffect(() => {}, []); // Empty dependency array for componentDidMount behavior

    return (
        <Provider store={Store}>
            <Router />
        </Provider>
    );
}

export default App;
