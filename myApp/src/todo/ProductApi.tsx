import {authConfig, config, getLogger, withLogs} from "../core";
import {ProductProps} from "./ProductProps";
import axios from "axios";

const log = getLogger('productApi');

const baseUrl = 'localhost:3000';
const productUrl = `http://${baseUrl}/api/product`;

export const getProducts: (token: string) => Promise<ProductProps[]> = token => {
    return withLogs(axios.get(productUrl, authConfig(token)), 'getProducts');
}

export const createProduct: (token: string, product: ProductProps) => Promise<ProductProps[]> = (token, product) => {
    return withLogs(axios.post(productUrl, product, authConfig(token)), 'createProduct');
}

export const updateProduct: (token: string, product: ProductProps) => Promise<ProductProps[]> = (token, product) => {
    return withLogs(axios.put(`${productUrl}/${product.id}`, product, authConfig(token)), 'updateProduct');
}

interface MessageData {
    type: string;
    payload: {
        product: ProductProps;
    };
}

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => { // onMessage -> callback defined by the provider
    const ws = new WebSocket(`ws://${baseUrl}`);
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
    }
    ws.onclose = () => {
        log('web socket onclose');
    }
    ws.onerror = error => {
        log('web socket onerror');
    }
    ws.onmessage = messageEvent => { // when a message from the server is received the callback is called
        log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data));
    }
    return () => {
        ws.close();
    }
}