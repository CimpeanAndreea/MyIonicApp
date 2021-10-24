import {getLogger} from "../core";
import {ProductProps} from "./ProductProps";
import axios from "axios";

const log = getLogger('productApi');

const baseUrl = 'localhost:3000';
const productUrl = `http://${baseUrl}/product`;

interface ResponseProps<T> {
    data: T;
}

function withLogs<T>(promise: Promise<ResponseProps<T>>, functionName: string): Promise<T> {
    log(`${functionName} - started`);
    return promise
        .then(res => {
            log(`${functionName} - succeeded`);
            return Promise.resolve(res.data);
        })
        .catch(err => {
            log(`${functionName} - failed`);
            return Promise.reject(err);
        });
}

const config = {
    headers: {
        'Content-Type' : 'application/json'
    }
}

export const getProducts: () => Promise<ProductProps[]> = () => {
    return withLogs(axios.get(productUrl, config), 'getProducts');
}

export const createProduct: (product: ProductProps) => Promise<ProductProps[]> = product => {
    return withLogs(axios.post(productUrl, product, config), 'createProduct');
}

export const updateProduct: (product: ProductProps) => Promise<ProductProps[]> = product => {
    return withLogs(axios.put(`${productUrl}/${product.id}`, product, config), 'updateProduct');
}

interface MessageData {
    event: string;
    payload: {
        product: ProductProps;
    };
}

export const newWebSocket = (onMessage: (data: MessageData) => void) => { // onMessage -> callback defined by the provider
    const ws = new WebSocket(`ws://${baseUrl}`);
    ws.onopen = () => {
        log('web socket onopen');
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