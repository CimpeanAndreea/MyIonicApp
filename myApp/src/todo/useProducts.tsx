import {getLogger} from "../core";
import {useEffect, useReducer, useState} from "react";
import {ProductProps} from "./ProductProps";
import {getProducts} from "./ProductApi";

const log = getLogger('useProducts');

export interface ProductsState {
    products?: ProductProps[],
    fetching: boolean,
    fetchingError?: Error,
}

export interface ProductsProps extends ProductsState {
    addProduct: () => void,
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: ProductsState = {
    products: undefined,
    fetching: false,
    fetchingError: undefined,
};

const FETCH_PRODUCTS_STARTED = 'FETCH_PRODUCTS_STARTED';
const FETCH_PRODUCTS_SUCCEEDED = 'FETCH_PRODUCTS_SUCCEEDED';
const FETCH_PRODUCTS_FAILED = 'FETCH_PRODUCTS_FAILED'

// a function that returns a new state
// comes from React
const reducer: (sate: ProductsState, action: ActionProps) => ProductsState =
    (state, {type, payload}) => {
        switch(type) {
            case FETCH_PRODUCTS_STARTED:
                return { ...state, fetching: true };
            case FETCH_PRODUCTS_SUCCEEDED:
                return { ...state, fetching: false, products: payload.products }
            case FETCH_PRODUCTS_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false}
            default:
                return state;
        }
    };

//custom hook = a simple function
export const useProducts: () => ProductsProps = () => {
    const [state, dispatch] = useReducer(reducer, initialState); // a reducer returns the current state & a dispatch function
    const { products, fetching, fetchingError } = state;

    const addProduct = () => {
      log('addProduct - TODO')
    };

    useEffect(getProductsEffect, []); // side effect called after the component is mounted
    log('returns');
    return {
        products,
        fetching,
        fetchingError,
        addProduct
    }

    function getProductsEffect() {
        log("entered get products effect ");

        let canceled = false;
        fetchItems();
        return () => {
            canceled = true;
        }

        async function fetchItems() {
            try {
                log('fetchingProducts started');
                dispatch({type: FETCH_PRODUCTS_STARTED});
                const products = await getProducts();
                log('fetchProducts succeeded');
                if(!canceled) {
                    dispatch({type: FETCH_PRODUCTS_SUCCEEDED, payload: { products }});
                }
            } catch (error) {
                log('fetchProducts failed');
                if(!canceled) {
                    // @ts-ignore
                    dispatch({type: FETCH_PRODUCTS_FAILED, payload: { error }});
                }
            }
        }
    }

}