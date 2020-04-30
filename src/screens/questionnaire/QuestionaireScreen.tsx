import React, { useReducer, useState } from 'react';
import { QuestionSection } from './QuestionSection';
import { RadarChart } from '../../components/RadarChart';
import getQuestions, { Answer, Question } from './getQuestions';
import getMeasurements from './getMeasurements';
import firebase from 'firebase';
import FirebaseAuth from '../../components/FirebaseAuth';
import firebaseui from 'firebaseui';
import saveUserAnswers from './saveUserAnswers';

// export type State = {
//   questions: {
//     question: Question;
//     selectedAnswer: Answer | undefined;
//   }[];
// }

// export type Action =
//   | { type: 'answerSelected', question: Question, answer: Answer }

// function reducer(state: State, action: Action) {
//   switch (action.type) {
//     case 'answerSelected':
//       return {
//         questions: state.questions.map(({ question, selectedAnswer }) =>
//           question.text === action.question.text ?
//             { question, selectedAnswer: action.answer } :
//             { question, selectedAnswer }
//         )
//       }
//   }
// }

export interface SelectedAnswers {
  [questionId: string]: Answer
}

export const QuestionaireScreen = () => {
  const questions = getQuestions();
  const measurements = getMeasurements();
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [showSignIn, setShowSignIn] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // const intialState: State = {
  //   questions: questions.map(q => ({ question: q, selectedAnswer: undefined }))
  // };

  // const [state, dispatch] = useReducer(reducer, intialState);

  // firebase.auth().signOut();

  const handleSaveUserAnswers = async (userId: string) => {
    await saveUserAnswers(userId, Object.values(selectedAnswers))
    setShowResults(true);
  }

  const handleQuestionaireComplete = () => {
    // Firebase user might or might not be set
    const user = firebase.auth().currentUser;
    if (user === null) {
      setShowSignIn(true)
    } else {
      handleSaveUserAnswers(user.uid);
    }
  }

  console.log(measurements);
  return (
    <div className="flex flex-row items-center h-screen bg-gray-100">
      {showResults
        ?
        <div className="flex flex-1 flex-col items-center">
          <p>Thank you, you results are saved!</p>
        </div>
        :
        showSignIn
          ?
          <div className="flex flex-1 flex-col items-center">
            <p>Sign up now to save your results!</p>
            <FirebaseAuth
              uiConfig={{
                signInOptions: [
                  firebase.auth.GoogleAuthProvider.PROVIDER_ID,
                  firebase.auth.EmailAuthProvider.PROVIDER_ID,
                ],
                signInFlow: 'popup',
                callbacks: {
                  signInSuccessWithAuthResult: (authResult: firebase.auth.UserCredential) => {
                    // Save results?
                    if (!authResult.user) {
                      alert('Firebase user was not set!');
                      return false;
                    }
                    handleSaveUserAnswers(authResult.user.uid);
                    return false;
                  }
                }
              }}
              firebaseAuth={firebase.auth()} />
          </div>
          :
          <div className="flex flex-1 flex-col">
            {questions &&
              <QuestionSection
                questions={questions}
                selectedAnswers={selectedAnswers}
                onAnswerSelected={(question, answer) => {
                  setSelectedAnswers({
                    ...selectedAnswers,
                    [question.id]: answer,
                  })
                }}
                onComplete={handleQuestionaireComplete} />
            }
          </div>
      }
      <div className="flex-shrink p-8 m-16 shadow-md rounded-chart bg-white">
        {measurements && <RadarChart
          maxValue={10}
          minValue={0}
          measurements={measurements.map(m => ({ label: m, value: Object.values(selectedAnswers).reduce((sum, answer) => sum + (answer.measurement === m ? answer.value : 0), 0) }))}
        />
        }
      </div>
    </div>
  );
}