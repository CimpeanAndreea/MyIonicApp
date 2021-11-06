import React from "react";
import {getLogger} from "../core";
import {ProductProps} from "./ProductProps";
import {IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel} from "@ionic/react";

const log = getLogger('Product');

interface ProductPropsExt extends ProductProps {
    onEdit: (_id?: string) => void;
}

// card of a product
const Product: React.FC<ProductPropsExt> = ({ _id, productName, price, quantity, onEdit}) => {
    //log(`render ${name}`);
    return(
        <IonCard onClick={() => onEdit(_id)}>
            <IonCardHeader>
                <IonCardTitle>{productName}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <IonItem>Price: {price}</IonItem>
                <IonItem>Quantity: {quantity}</IonItem>
            </IonCardContent>

        </IonCard>
  );
};

export default Product;