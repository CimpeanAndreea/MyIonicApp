// provides data for other children components, does not have an ui representation

import React, {useCallback, useContext, useEffect, useReducer, useState} from "react";
import {getLogger} from "../core";
import {ProductProps} from "./ProductProps";
import PropTypes from 'prop-types';
import { AuthContext } from "../auth";
import { createProduct, getProducts, newWebSocket, updateProduct } from "./productApi";
import { useNetwork } from "../network/useNetwork";
import { Storage } from '@capacitor/storage';

const log = getLogger('ProductProvider');

type SaveProductFn = (product: ProductProps) => Promise<any>; // function to save product

// products state
export interface ProductsState {
    products?: ProductProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    saveProduct?: SaveProductFn,
}

// type of an action -> save product succeeded/... and some return data
interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: ProductsState = {
    fetching: false,
    saving: false,
};

const FETCH_PRODUCTS_STARTED = 'FETCH_PRODUCTS_STARTED';
const FETCH_PRODUCTS_SUCCEEDED = 'FETCH_PRODUCTS_SUCCEEDED';
const FETCH_PRODUCTS_FAILED = 'FETCH_PRODUCTS_FAILED';
const SAVE_PRODUCT_STARTED = 'SAVE_PRODUCT_STARTED';
const SAVE_PRODUCT_SUCCEEDED = 'SAVE_PRODUCT_SUCCEEDED';
const SAVE_PRODUCT_FAILED = 'SAVE_PRODUCT_FAILED';
const SAVE_PRODUCT_OFFLINE = 'SAVE_PRODUCT_OFFLINE';

// return a state depending on the action type
const reducer: (sate: ProductsState, action: ActionProps) => ProductsState =
    (state, { type, payload }) => {
        switch(type) {
            case FETCH_PRODUCTS_STARTED:
                return { ...state, fetching: true, fetchingError: null };
            case FETCH_PRODUCTS_SUCCEEDED:
                return { ...state, products: payload.products, fetching: false };
            case FETCH_PRODUCTS_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false };
            case SAVE_PRODUCT_STARTED:
                return { ...state, savingError: null, saving: true };
            case SAVE_PRODUCT_SUCCEEDED:
                const products = [...(state.products || [])];
                const product = payload.product;
                const index = products.findIndex(prod => prod._id === product._id);
                if(index === -1 || !product._id) {
                    products.splice(0, 0, product);
                } else {
                    products[index] = product;
                }
                return { ...state, products, saving: false };
            case SAVE_PRODUCT_FAILED:
                return { ...state, savingError: payload.error, saving: false };
            default:
                return state;
        }
    };

export const ProductContext = React.createContext<ProductsState>(initialState);

interface ProductProviderProps {
    children: PropTypes.ReactNodeLike,
}

// children -> children components
export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
    const { token } = useContext(AuthContext); 
    const [state, dispatch] = useReducer(reducer, initialState);
    const { products, fetching, fetchingError, saving, savingError } = state;
    const { networkStatus } = useNetwork();

    const [savedOffline, setSavedOffline] = useState<boolean>(false);

    // useCallback = same function instance for same dependencies, accross renders
    const saveProduct = useCallback<SaveProductFn>(saveProductCallback, [token, networkStatus]);

    useEffect(getProductsEffect, [token, networkStatus]);
    // useEffect -> executed when any of the dependencies changes
    useEffect(wsEffect, [token, networkStatus]); // side effect, (executed once the component is rendered) executed once the token changes
    useEffect(networkStatusChanged, [networkStatus]);

    const value = { products, fetching, fetchingError, saving, savingError, saveProduct };

    log('returns');
    // value can be accessed by all the children
    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );

    function networkStatusChanged() {
        (async () => {
            if(networkStatus.connected) {
                const res = await Storage.get({ key: 'unsavedProducts' });
                if (res.value) {
                    const unsavedProducts:ProductProps[] = JSON.parse(res.value);
                    unsavedProducts.forEach(prod => {
                        saveProduct(prod);
                    });
                }
                await Storage.remove({ key: 'unsavedProducts' });
            }
        })();
    }

    function getProductsEffect() {
        let canceled = false;
        fetchItems();
        return () => {
            canceled = true;
        }

        async function fetchItems() {
            if(!networkStatus.connected) {
                const res = await Storage.get({ key: 'unsavedProducts' });
                if (res.value) {
                    const unsavedProducts:ProductProps[] = JSON.parse(res.value);
                    unsavedProducts.forEach(prod => {
                        products?.splice(0, 0, prod);
                    });
                    dispatch({type: FETCH_PRODUCTS_SUCCEEDED, payload: {products: products}});
                }
            } 
            if (!token?.trim()) {
                return;
            }
            try {
                log('fetchingProducts started');
                dispatch({ type: FETCH_PRODUCTS_STARTED });
                const products = await getProducts(token);
                log('fetchProducts succeeded');
                if(!canceled) {
                    dispatch({ type: FETCH_PRODUCTS_SUCCEEDED, payload: { products } });
                    for (const prod of products) {
                        await Storage.set({
                            key: prod._id!,
                            value: JSON.stringify({
                                _id: prod._id,
                                productName: prod.productName,
                                price: prod.price,
                                quantity: prod.quantity,
                                category: prod.category
                            })
                        })
                    }
                }
            } catch (error) {
                log('fetchProducts failed');
                const res = await Storage.get({ key: 'unsavedProducts' });
                if (res.value) {
                    const unsavedProducts:ProductProps[] = JSON.parse(res.value);
                    unsavedProducts.forEach(prod => {
                        products?.splice(0, 0, prod);
                    });
                    dispatch({type: FETCH_PRODUCTS_SUCCEEDED, payload: {products: products}});
                }
                if(!canceled) {
                    // @ts-ignore
                    dispatch({type: FETCH_PRODUCTS_FAILED, payload: { error }});
                }
            }
        }
    }

    async function saveProductCallback(product: ProductProps) {
        if(!networkStatus.connected) {
            alert("Product saved offline");
            const res = await Storage.get({ key: 'unsavedProducts' });
            if (res.value) {
                var unsavedProducts = JSON.parse(res.value);
                unsavedProducts.push(product);
                await Storage.set({
                    key: 'unsavedProducts',
                    value: JSON.stringify(unsavedProducts)
                  });
            } else {
                const unsavedProducts: ProductProps[] = [];
                unsavedProducts.push(product);
                await Storage.set({
                    key: 'unsavedProducts',
                    value: JSON.stringify(unsavedProducts)
                  });
            }
            dispatch({ type: SAVE_PRODUCT_SUCCEEDED, payload: { product: product } });
            setSavedOffline(true);
        }
        else {
            try {
                log('saveProduct started');
                dispatch({ type : SAVE_PRODUCT_STARTED });
                const savedProduct = await (product._id ? updateProduct(token, product) : createProduct(token, product));
                log('saveProduct succeeded');
                dispatch({ type: SAVE_PRODUCT_SUCCEEDED, payload: { product: savedProduct } });
            } catch (error) {
                log('savedItem failed');
                dispatch( { type: SAVE_PRODUCT_FAILED, payload: { error } });
            }
        }
    }

    function wsEffect() {
        if(networkStatus.connected) {
            let canceled = false;
            log('wsEffect - connecting');
            let closeWebSocket: () => void;
            if(token?.trim()) {
                closeWebSocket = newWebSocket(token, message => { // callback
                    if (canceled) {
                        return;
                    }
                    const { type, payload: product } = message;
                    log(`ws message, item ${type}`);
                    if(type === 'created' || type === 'updated') {
                        dispatch( { type: SAVE_PRODUCT_SUCCEEDED, payload: { product } });
                    }
                });
            }
            return () => { // in case component was unmounted
                log('wsEffect - disconnecting');
                canceled = true;
                closeWebSocket?.();
            }
        }
    }
};