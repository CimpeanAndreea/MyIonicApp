import React from "react";
import {getLogger} from "../core";
import {ProductProps} from "./ProductProps";
import {IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel} from "@ionic/react";

const log = getLogger('Product');

interface ProductPropsExt extends ProductProps {
    onEdit: (id?: string) => void;
}

const Product: React.FC<ProductPropsExt> = ({id, name, price, quantity, onEdit}) => {
    //log(`render ${name}`);
    return(
        <IonCard onClick={() => onEdit(id)}>
            <IonCardHeader>
                <IonCardTitle>{name}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <IonItem>Price: {price}</IonItem>
                <IonItem>Quantity: {quantity}</IonItem>
            </IonCardContent>

        </IonCard>
  )
};

export default Product;