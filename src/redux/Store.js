import { createStore, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk'; // Thay đổi cách import này
import { createLogger } from 'redux-logger';
import rootReducer from './reducers';

const middlewares = [];
if (process.env.NODE_ENV === `development`) {
    middlewares.push(createLogger());
}

middlewares.push(thunk);

const middleWare = applyMiddleware(...middlewares);
const Store = createStore(rootReducer, compose(middleWare));

export default Store;