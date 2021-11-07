import React, { useContext } from "react";
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
import { getLogger } from "../core";
import { add, wifi } from "ionicons/icons";
import { ProductContext } from "./ProductProvider";
import { RouteComponentProps } from "react-router";
import { useNetwork } from "../network/useNetwork";
import './Product.css';

const log = getLogger('ProductList');

const ProductList: React.FC<RouteComponentProps> = ({ history }) => {
    const { products, fetching, fetchingError } = useContext(ProductContext); // returns the value of the context(see the context as a service)
    const { networkStatus } = useNetwork();

    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="toolbar">
                    {networkStatus.connected && (
                        <IonIcon icon={wifi} slot="start" style={{fontSize:26, color: 'green'}}></IonIcon>
                    )}
                    {!networkStatus.connected && (
                        <IonIcon icon={wifi} slot="start" style={{fontSize:26, color: 'red'}}></IonIcon>
                    )}
                    <IonTitle>Products App</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching products" />
                {products && (
                    <IonList>
                        {products.map(({ _id, productName, price, quantity}) =>
                            <Product key={_id} _id={_id} productName={productName} price={price} quantity={quantity} onEdit={_id => history.push(`/product/${_id}`)} />)}
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