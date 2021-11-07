import React, { useContext } from "react";
import { getLogger } from "../core";
import PropTypes from 'prop-types';
import { AuthContext, AuthState } from "./AuthProvider";
import { Redirect, Route } from "react-router";

const log = getLogger('Login');

//like <Route> pattern
export interface PrivateRouteProps {
    component: PropTypes.ReactNodeLike;
    path: string;
    exact?: boolean;
}

// ...a -> spread syntax -> take an iterable and expands it into individual elements
// ...rest -> { path, exact, children }
// ...props -> properties of the component
export const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest}) => {
    const { isAuthenticated } = useContext<AuthState>(AuthContext);
    log('render, isAuthenticated', isAuthenticated);

    return (
        <Route {...rest} render={props => {
            if (isAuthenticated) {
                // @ts-ignore
                return <Component {...props} />;
            }
            return <Redirect to={{pathname: '/login'}}/>
        }}/>
    );
}