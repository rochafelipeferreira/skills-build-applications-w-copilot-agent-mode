import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  _id?: string;
  type: string;
  minutes: number;
  points: number;
};

type ActivitiesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; activities: Activity[] };

export default function Activities() {
  const [state, setState] = useState<ActivitiesState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities }) => {
        if (active) setState({ status: 'loaded', activities });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {state.status === 'loading' && <p role="status">Loading activities...</p>}
        {state.status === 'error' && <p role="alert">Unable to load activities.</p>}
        {state.status === 'loaded' && state.activities.length === 0 && <p role="status">No activities yet.</p>}
        {state.status === 'loaded' && state.activities.length > 0 && (
          <ul className="list-group list-group-flush">
            {state.activities.map((activity, index) => (
              <li className="list-group-item d-flex justify-content-between" key={activity._id ?? `${activity.type}-${index}`}>
                <span>{activity.type}</span>
                <span>{activity.minutes} minutes</span>
                <span>{activity.points} points</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
