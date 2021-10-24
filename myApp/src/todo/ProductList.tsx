import React, {useContext, useState} from "react";
import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon, IonList,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from "@ionic/react";
import Product from "./Product";
import {getLogger} from "../core";
import {add} from "ionicons/icons";
import {ProductContext} from "./ProductProvider";
import {RouteComponentProps} from "react-router";

const log = getLogger('ProductList');

const ProductList: React.FC<RouteComponentProps> = ({ history }) => {
    const { products, fetching, fetchingError } = useContext(ProductContext); // returns the value of the context(see the context as a service)

    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>My App</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching products" />
                {products && (
                    <IonList>
                        {products.map(({id, name, price, quantity}) =>
                            <Product key={id} id={id} name={name} price={price} quantity={quantity} onEdit={id => history.push(`/product/${id}`)} />)}
                    </IonList>
                )}
                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch products'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/product')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );











};

export default ProductList;