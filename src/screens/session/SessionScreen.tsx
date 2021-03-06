import React, { useEffect } from 'react';
import { generatePath, Redirect, useHistory, useParams } from 'react-router';
import { RadarChart } from '../../components/RadarChart';
import { convertAnswers } from '../../util/converUserAnswers';
import { getUserId } from '../overview/getUserId';
import { answerValues } from '../overview/OverviewScreen';
import getMeasurements, { Measurement } from '../questionnaire/getMeasurements';
import getSession from './getSession';
import startSession, { Session } from './startSession';

const userEmojis = ['🤠', '🧙‍♂️', '🎅', '🤖', '🕵️'];

const hashCode = (input: string) => {
    let hash = 0,
        i,
        chr;
    for (i = 0; i < input.length; i++) {
        chr = input.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

const AnswersTable = (props: {
    sessionId: string;
    measurements: Measurement[];
    submissions: Session['submissions'];
}) => {
    const { sessionId, measurements, submissions } = props;

    /*
    We want every submission to get unique avatar.
    But we also want to randomize so that it doesn't depend on the order.
    We are using sessionId as a seed to shift indicies.
    */
    const hash = Math.abs(hashCode(sessionId));
    const emojiMap = Object.keys(submissions).reduce<{ [s: string]: string }>(
        (acc, s, i) => ({
            ...acc,
            [s]: userEmojis[(hash + i) % userEmojis.length],
        }),
        {},
    );

    return (
        <table>
            <thead>
                <tr>
                    <th></th>
                    {Object.keys(submissions).map((s) => (
                        <th key={s} className="text-3xl">
                            {emojiMap[s]}
                        </th>
                    ))}
                    <th>Average</th>
                </tr>
            </thead>
            <tbody>
                {measurements.map((m) => {
                    const sum = Object.values(submissions).reduce((sum, s) => {
                        return sum + answerValues(s.answers, m);
                    }, 0);
                    const submissionCount = Object.keys(submissions).length;
                    const avg = submissionCount > 0 ? (sum / submissionCount).toFixed(1) : (0.0).toFixed(1);

                    return (
                        <tr key={m}>
                            <td className="border px-4 py-2">{m}</td>
                            {Object.entries(submissions).map(([key, a]) => (
                                <td className="border text-center px-8 py-2" key={key}>
                                    {answerValues(a.answers, m)}
                                </td>
                            ))}
                            <td className="border text-center px-8 py-2">{avg}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export const NewSessionScreen = () => {
    const userId = getUserId()!;
    const history = useHistory();

    useEffect(() => {
        const promise = async () => {
            const session = await startSession(userId);
            history.replace(`/sessions/${session.id}`);
        };
        promise();
    }, []);

    return <p>Creating new session</p>;
};

export const SessionScreen = () => {
    const { id } = useParams();
    const measurements = getMeasurements();
    const session = getSession(id);

    if (!measurements || session.loading) {
        return <p>Loading</p>;
    }

    if (!session.data) {
        // 404 - session not found
        return <Redirect to="/" />;
    }

    console.log(`Session: ${session.data}`);

    const path = generatePath('/questionaire?sessionId=:sessionId', { sessionId: id });

    const sumbissionCount = Object.keys(session.data.submissions).length;
    const avgValues =
        sumbissionCount > 0
            ? Object.values(session.data.submissions)
                  .map(({ answers }) => convertAnswers(answers, measurements))
                  .reduce<number[]>((acc, s) => acc.map((v, i) => v + s[i]), new Array(measurements.length).fill(0))
                  .map((v) => v / sumbissionCount)
            : new Array(measurements.length).fill((0.0).toFixed(1));

    return (
        <div className="p-4">
            <p>
                Take questionaire:{' '}
                <a className="underline text-blue-400" href={path}>
                    Link
                </a>
            </p>
            <p className="mt-4">Results:</p>
            <div className="flex flex-col p-4 lg:flex-row items-center">
                <AnswersTable
                    sessionId={session.data.id}
                    submissions={session.data.submissions}
                    measurements={measurements}
                />
                <div className=" mt-8 lg:mt-0 lg:ml-auto">
                    {measurements && (
                        <RadarChart maxValue={5} minValue={0} measurements={measurements} values={avgValues} />
                    )}
                </div>
            </div>
        </div>
    );
};
