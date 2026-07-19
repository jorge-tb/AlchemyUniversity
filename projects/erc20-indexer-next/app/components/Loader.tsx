import styles from './Loader.css';

import { Dispatch, SetStateAction } from 'react';

export function Loader() {
    return <div className="loader" role="status" aria-label="Loading" />
}

export async function withLoader<T>(
    promise: Promise<T>, 
    loaderSetter: Dispatch<SetStateAction<boolean>>
): Promise<T> {
    loaderSetter(true);
    try {
        return await promise;
    } finally {
        loaderSetter(false);
    }
}