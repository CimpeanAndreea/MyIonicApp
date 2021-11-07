import { SetStateAction, useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { getLogger } from '../core';

const log = getLogger('UseNetwork');

const initialState = {
    connected: false,
    connectionType: 'unknown',
}

export const useNetwork = () => { //custom hook
    const [networkStatus, setNetworkStatus] = useState(initialState);
    useEffect(() => {
        const handler = Network.addListener('networkStatusChange', handleNetworkStatusChange);
        Network.getStatus().then(handleNetworkStatusChange);
        let canceled = false;
        return () => {
            canceled = true;
            handler.remove();
        }

        function handleNetworkStatusChange(status: SetStateAction<{ connected: boolean; connectionType: string; }>) {
            log('Status changed', status);
            if (!canceled) {
                setNetworkStatus(status);
            }
        }
    }, [])
    return { networkStatus };
}