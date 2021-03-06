import {getLogger} from "../core";
import {RouteComponentProps} from "react-router";
import React, {useContext, useEffect, useState} from "react";
import {ProductContext} from "./ProductProvider";
import {ProductProps} from "./ProductProps";
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput, IonItem, IonLabel,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from "@ionic/react";

const log = getLogger('ProductEdit');

interface ProductEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const ProductEdit: React.FC<ProductEditProps> = ({ history, match }) => {
    const { products, saving, savingError, saveProduct } = useContext(ProductContext);
    const [name, setName] = useState<string>('');
    const [price, setPrice] = useState<number>(0.1);
    const [quantity, setQuantity] = useState<number>(1);

    const [product, setProduct] = useState<ProductProps>();

    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const product = products?.find(prod => prod.id === routeId);
        setProduct(product);
        if (product) {
            setName(product.name);
            // @ts-ignore
            setPrice(product.price);
            // @ts-ignore
            setQuantity(product.quantity);
        }
    },  [match.params.id, products]);

    const handleSave = () => {
        const editedProduct = product ? {
            ...product, name, price, quantity } : { name, price, quantity };
        saveProduct && saveProduct(editedProduct).then(() => history.goBack());
    };

    log('render');

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit Product</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            Save
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonItem>
                    <IonLabel position="floating">Product Name</IonLabel>
                    <IonInput value={name} onIonChange={e => setName(e.detail.value || '')}/>
                </IonItem>

                <IonItem>
                    <IonLabel position="floating">Price</IonLabel>
                    <IonInput type="number" value={price} onIonChange={e => setPrice(e.detail.value ? +e.detail.value : 0)}/>
                </IonItem>

                <IonItem>
                    <IonLabel position="floating">Quantity</IonLabel>
                    <IonInput type="number" value={quantity} onIonChange={e => setQuantity(e.detail.value ? +e.detail.value : 0)}/>
                </IonItem>

                <IonLoading isOpen={saving}/>
                {savingError && (
                    <div>{savingError.message || 'Failed to save product'}</div>
                )}
            </IonContent>
        </IonPage>
    );

};

export default ProductEdit;