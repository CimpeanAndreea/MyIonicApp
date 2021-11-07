import React, { useCallback, useEffect, useState } from "react";
import { getLogger } from "../core";
import PropTypes from 'prop-types';
import { login as loginApi } from './authApi';
import { Storage } from '@capacitor/storage';

const log = getLogger('AuthProvider');

type LoginFn = (username?: string, password?: string) => void;
type LogoutFn = () => void;

// Authorization state
export interface AuthState {
    authenticationError: Error | null;
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    login?: LoginFn;
    logout?: LogoutFn;
    pendingAuthentication?: boolean;
    username?: string;
    password?: string;
    token: string;
}

const initialState: AuthState = {
    isAuthenticated: false,
    isAuthenticating: false,
    authenticationError: null,
    pendingAuthentication: false,
    token: '',
};

// create a context with the initial state
export const AuthContext = React.createContext<AuthState>(initialState);

// children of <AuthProvider>
interface AuthProviderProps {
    children: PropTypes.ReactNodeLike,
}

// <AuthProvider>
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    useEffect(getTokenFromLocalStorage, []);
    const [state, setState] = useState<AuthState>(initialState); // return a state(with initial) with a function to update it
    const { isAuthenticated, isAuthenticating, authenticationError, pendingAuthentication, token } = state;
    
    const login = useCallback<LoginFn>(loginCallback, []); //call login 
    const logout = useCallback<LogoutFn>(logoutCallback, []);
    
    useEffect(authenticationEffect, [pendingAuthentication]); // apply authenticationEffect only if pendingAuthentication changes
    
    const value = { isAuthenticated, login, logout, isAuthenticating, authenticationError, token };
    
    function getTokenFromLocalStorage() {
        (async () => {
            const res = await Storage.get({ key: 'userToken' });
            if (res.value) {
                setState({
                    ...state,
                    token: res.value,
                    isAuthenticated: true,
                    isAuthenticating: false,
                });
            }
        })();
    }


    log('render');
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )

    //call login -> pending = true, give username, password
    function loginCallback(username?: string, password?: string): void {
        log('login');
        setState({
            ...state,
            pendingAuthentication: true,
            username,
            password
        });
    }

    function logoutCallback(): void {
        (async () => {
            log('logout');
            await Storage.remove({ key: 'userToken' });
            setState({
                ...state,
                isAuthenticated: false,
                isAuthenticating: false,
                authenticationError: null,
                pendingAuthentication: false,
                token: '',
            });
        })();
    }


    function authenticationEffect() {
        let canceled = false;
        authenticate();
        return () => {
            canceled = true;
        }

        async function authenticate() {
            if(!pendingAuthentication) {
                log('authenticate, !pendingAuthentication, return');
                return;
            }
            try {
                log('authenticate...');
                setState({
                    ...state,
                    isAuthenticating: true, //in authentication process
                });
                const { username, password } = state;
                const { token } = await loginApi(username, password); // get token based on credentials
                await Storage.set({
                    key: 'userToken',
                    value: token
                  });
                
                if(canceled) {
                    return;
                }
                log('authentication succeeded');
                setState({  // if everything ok -> authenticated state
                    ...state,
                    token,
                    pendingAuthentication: false,
                    isAuthenticated: true,
                    isAuthenticating: false,
                })
            } catch (error) {
                if(canceled) {
                    return;
                }
                log('authenctication failed');
                setState({ // error else
                    ...state,
                    //@ts-ignore
                    authenticationError: error,
                    pendingAuthentication: false,
                    isAuthenticating: false,
                });
            }
        }
    }
};