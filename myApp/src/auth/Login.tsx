import { getLogger } from "../core";
import React, { useContext, useState } from 'react';
import { Redirect, RouteComponentProps } from "react-router";
import { AuthContext } from "./AuthProvider";
import { IonButton, IonContent, IonHeader, IonInput, IonLoading, IonPage, IonTitle, IonToolbar } from "@ionic/react";

const log = getLogger('Login');

interface LoginState {
    username?: string;
    password?: string;
}

// Login component
export const Login: React.FC<RouteComponentProps> = ({ history }) => {
    const { isAuthenticated, isAuthenticating, login, authenticationError } = useContext(AuthContext);
    const [state, setState] = useState<LoginState>({});
    const { username, password } = state;
    
    const handleLogin = () => { // handle Login button press -> call login
        log('handleLogin...');
        login?.(username, password); // call login
    };
    log('render');
    if(isAuthenticated) {
        return <Redirect to={{ pathname: '/' }}/> // if authenticated redirect to page in app
    }
    return ( // else return login form
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Login</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonInput 
                    placeholder="Username"
                    value={username}
                    onIonChange={e => setState({
                        ...state,
                        username: e.detail.value || ''
                    })}/>
                <IonInput 
                    placeholder="Password"
                    value={password}
                    type="password"
                    onIonChange={e => setState({
                        ...state,
                        password: e.detail.value || ''
                    })}/>
                <IonLoading isOpen={isAuthenticating}/>
                {authenticationError && (
                    <div>{authenticationError.message || 'Failed to authenticate'}</div>
                )}
                <IonButton onClick={handleLogin}>Login</IonButton>
            </IonContent>
        </IonPage>
    );
};