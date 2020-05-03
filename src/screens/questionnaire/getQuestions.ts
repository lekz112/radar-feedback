import firebase from 'firebase';
import { useState, useEffect } from 'react';

export interface Answer {
    id: string;
    text: string;
    measurement: string;
    value: number;
}

export interface Question {
    id: string;
    isMultipleChoice: boolean;
    text: string;
    answers: Answer[];
}

export default () => {
    const [questions, setQuestions] = useState<Question[]>()

    const getFromFirestore = async () => {
        const doc = await firebase.firestore().collection('questions').doc('sport').get();   
        const result = doc.data()?.list;    
        setQuestions(result);
    }

    useEffect(() => {
        getFromFirestore()
    }, []);

    return questions;
}