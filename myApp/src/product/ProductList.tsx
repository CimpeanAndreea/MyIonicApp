import React, { useContext, useEffect, useState } from "react";
import {
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonList,
    IonLoading,
    IonPage,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
    useIonViewWillEnter
} from "@ionic/react";
import Product from "./Product";
import { getLogger } from "../core";
import { add, wifi, logOut } from "ionicons/icons";
import { RouteComponentProps } from "react-router";
import { useNetwork } from "../network/useNetwork";
import './Product.css';
import { AuthContext, AuthState } from "../auth";
import { ProductContext } from "./ProductProvider";
import { ProductProps } from "./ProductProps";

const log = getLogger('ProductList');
const offset = 2;

const ProductList: React.FC<RouteComponentProps> = ({ history }) => {
    
    const { products, fetching, fetchingError } = useContext(ProductContext); // returns the value of the context(see the context as a service)
    const { networkStatus } = useNetwork();
    const { logout } = useContext<AuthState>(AuthContext);

    log("PROD IN LIST", products);

    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(false);
    const [visibleProducts, setVisibleProducts] = useState<ProductProps[] | undefined>([]);
    const [page, setPage] = useState(0);
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState<string>("");

    const categories = ["All", "Food", "Electronics", "Books", "Clothes", "Random"];

    useEffect(() => {
        log("USE EFFECT PRODS", products);
        if(products?.length && products?.length > 0) {
            setPage(offset);
            fetchData();
        }
    }, [products])

    useEffect(() => {
        if(products && filter) {
            if (filter === "All") {
                setVisibleProducts(products);
            }
            else {
                setVisibleProducts(products.filter(each => each.category === filter));
            }
        }
    }, [filter]);

    useEffect(() => {
        if(search === "") {
            setVisibleProducts(products);
        }
        if(products && search !== "") {
            setVisibleProducts(products.filter(each => each.productName.startsWith(search)));
        }
    }, [search])

    function fetchData() {
        setVisibleProducts(products?.slice(0, page + offset));
        setPage(page + offset);
    }

    async function searchNext($event: CustomEvent<void>) {
        setTimeout(() => {
            if(search !== "" || (filter && filter !== "All" && filter !== "")) {
                setDisableInfiniteScroll(true);
                return;
            }
            fetchData();
            if (products && page > products.length) {
                setDisableInfiniteScroll(true);
                setPage(products.length);
            }
            ($event.target as HTMLIonInfiniteScrollElement).complete();
          }, 1000);
    }

    const handleLogout = () => { 
        log('handleLogout...');
        logout?.();
        history.push('/login');
    };

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
                    <IonIcon slot="end" icon={logOut} onClick={handleLogout} style={{fontSize:26}}></IonIcon>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonItem>
                    <IonSearchbar placeholder="Search by name" value={search} debounce={200} onIonChange={(e) => {
                        setSearch(e.detail.value!);
                    }}>
                    </IonSearchbar>
                </IonItem>
                <IonItem>
                    <IonSelect value={filter} placeholder="Filter by category" onIonChange={(e) => setFilter(e.detail.value)}>
                        {categories.map((each) => (
                            <IonSelectOption key={each} value={each}>
                                {each}
                            </IonSelectOption>
                        ))}
                    </IonSelect>
                </IonItem>
                <IonLoading isOpen={fetching} message="Fetching products" />
                {visibleProducts && (
                    <IonList>
                        {Array.from(visibleProducts)
                            .map(({ _id, productName, price, quantity, category }) =>
                            <Product key={_id} _id={_id} productName={productName} price={price} quantity={quantity} category={category} onEdit={_id => history.push(`/product/${_id}`)} />)}
                    </IonList>
                )}

                <IonInfiniteScroll threshold="100px" disabled={disableInfiniteScroll} onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
                    <IonInfiniteScrollContent 
                        loadingSpinner="bubbles"
                        loadingText="Loading...">
                    </IonInfiniteScrollContent>
                </IonInfiniteScroll>

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