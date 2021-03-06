import { useState, useEffect } from 'react';
import firebase from 'firebase';
import { Session } from './startSession';
import { Result } from '../../util/result';

export default (userId: string) => {
    const [result, setResult] = useState<Result<Session[]>>({ loading: true });

    useEffect(() => {
        firebase
            .firestore()
            .collection('sessions')
            .where('owner', '==', userId)
            .onSnapshot({
                next: (data) => {
                    const result = data.docs.map((doc) => doc.data());
                    setResult({
                        loading: false,
                        data: result.map((r) => ({
                            ...r,
                            timestamp: r.timestamp.toDate(),
                        })) as Session[],
                    });
                },
            });
    }, []);

    return result;
};
