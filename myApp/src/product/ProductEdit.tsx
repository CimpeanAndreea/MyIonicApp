import { getLogger } from "../core";
import { RouteComponentProps } from "react-router";
import React, { useContext, useEffect, useState } from "react";
import { ProductContext } from "./ProductProvider";
import { ProductProps } from "./ProductProps";
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput, IonItem, IonLabel,
    IonLoading,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar
} from "@ionic/react";

const log = getLogger('ProductEdit');

interface ProductEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const ProductEdit: React.FC<ProductEditProps> = ({ history, match }) => {
    const { products, saving, savingError, saveProduct } = useContext(ProductContext);
    const [productName, setProductName] = useState<string>('');
    const [price, setPrice] = useState<number>(0.1);
    const [quantity, setQuantity] = useState<number>(1);
    const [category, setCategory] = useState<string>('');

    const [product, setProduct] = useState<ProductProps>();

    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const product = products?.find(prod => prod._id === routeId);
        setProduct(product);
        if (product) {
            setProductName(product.productName);
            // @ts-ignore
            setPrice(product.price);
            // @ts-ignore
            setQuantity(product.quantity);
            // @ts-ignore
            setCategory(product.category);
        }
    },  [match.params.id, products]);

    const handleSave = () => {
        const editedProduct = product ? {
            ...product, productName, price, quantity } : { productName, price, quantity, category };
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
                    <IonInput value={productName} onIonChange={e => setProductName(e.detail.value || '')}/>
                </IonItem>

                <IonItem>
                    <IonLabel position="floating">Price</IonLabel>
                    <IonInput type="number" value={price} onIonChange={e => setPrice(e.detail.value ? +e.detail.value : 0)}/>
                </IonItem>

                <IonItem>
                    <IonLabel position="floating">Quantity</IonLabel>
                    <IonInput type="number" value={quantity} onIonChange={e => setQuantity(e.detail.value ? +e.detail.value : 0)}/>
                </IonItem>

                <IonItem>
                    <IonLabel>Category:  </IonLabel>
                    <IonSelect value={category} onIonChange={e => setCategory(e.detail.value)}>
                        <IonSelectOption value="Food">Food</IonSelectOption>
                        <IonSelectOption value="Electronics">Electronics</IonSelectOption>
                        <IonSelectOption value="Books">Books</IonSelectOption>
                        <IonSelectOption value="Clothes">Clothes</IonSelectOption>
                    </IonSelect>
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